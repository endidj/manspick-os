// 디렉터의 휴무와 이미 잡힌 시간을 반영해 예약 가능 일정을 보여줍니다.
import {
  datePlusDays,
  DomainError,
  koreaDate,
  holdExpiry,
  resolveCatalogPackage,
} from '@manspick/domain';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { directors } from './directors.ts';
import { reclaimableHold } from './holds.ts';
import { lastOccupiedDate, reservedIntervals } from './reservations.ts';
import { scheduleOption } from './schedule-options.ts';
import { catalog } from './catalog.ts';
import { operationsPolicy } from '../settings/operations-policy.ts';

export async function calendar(
  env: Env,
  packageId: string,
  shopping: boolean,
  addonIds: string[] = [],
) {
  const availableCatalog = await catalog(env);
  const pack = resolveCatalogPackage(availableCatalog.packages, packageId);
  if (!pack) throw new DomainError('INVALID_PACKAGE', '패키지를 확인해주세요.');
  packageId = pack.id;
  const composition = availableCatalog.packageItems.filter((item) => item.packageId === packageId);
  if (addonIds.some((id) => !composition.some((item) => item.itemId === id)))
    throw new DomainError('INVALID_ADDONS', '패키지에서 신청 가능한 옵션을 확인해주세요.');
  const includedIds = composition
    .filter((item) => item.inclusionType === 'included')
    .map((item) => item.itemId);
  const selectedIds = [
    ...new Set([...addonIds, ...includedIds, ...(shopping ? ['shopping'] : [])]),
  ];
  const selected = selectedIds.map((id) =>
    availableCatalog.addons.find((addon) => addon.id === id),
  );
  if (selected.some((addon) => !addon || addon.hiddenPackageIds.includes(packageId)))
    throw new DomainError('INVALID_ADDONS', '선택한 옵션을 확인해주세요.');
  const eligible = await directors(env, selectedIds);
  shopping = selectedIds.includes('shopping');
  const policy = await operationsPolicy(env);
  const now = new Date();
  const today = koreaDate(now);
  const dayCount = policy.bookingHorizonWeeks * 7;
  const end = datePlusDays(today, dayCount);
  const [locks, daysOff, occupied, windows, confirmed] = await Promise.all([
    rows<{ director_id: string; date: string; time: string }>(
      env,
      `SELECT l.director_id,l.date,l.time FROM slots l JOIN shoots s ON s.id=l.shoot_id
       WHERE l.date>? AND l.date<=? AND NOT ${reclaimableHold}`,
      today,
      end,
      now.toISOString(),
    ),
    rows<{ director_id: string; date: string }>(
      env,
      'SELECT director_id,date FROM director_days_off WHERE date>? AND date<=?',
      today,
      datePlusDays(end, 1),
    ),
    reservedIntervals(
      env,
      {
        startsAt: `${datePlusDays(today, 1)}T00:00:00+09:00`,
        endsAt: `${datePlusDays(end, 2)}T00:00:00+09:00`,
      },
      now.toISOString(),
    ),
    rows<{ director_id: string; starts_at: string; ends_at: string }>(
      env,
      'SELECT director_id,starts_at,ends_at FROM director_availability',
    ),
    rows<{ director_id: string; starts_at: string; ends_at: string }>(
      env,
      `SELECT s.director_id,c.occupancy_starts_at AS starts_at,c.occupancy_ends_at AS ends_at
      FROM booking_confirmations c JOIN shoots s ON s.id=c.booking_id WHERE s.status!='cancelled' AND c.occupancy_ends_at>=? AND c.occupancy_starts_at<?`,
      now.toISOString(),
      new Date(`${datePlusDays(end, 2)}T00:00:00+09:00`).toISOString(),
    ),
  ]);
  const configured = new Set(windows.map((item) => item.director_id));
  return {
    policy,
    days: Array.from({ length: dayCount }, (_, index) => {
      const date = datePlusDays(today, index + 1);
      return {
        date,
        slots: policy.slotTimes.map((time) => {
          let option: ReturnType<typeof scheduleOption>;
          try {
            option = scheduleOption(date, time, packageId, pack.duration, shopping, policy);
            holdExpiry(now, new Date(option.startsAt), policy);
          } catch {
            return { time, available: false };
          }
          const { slots: needed, interval } = option;
          const lastDate = lastOccupiedDate(date, interval);
          const available = eligible.some(
            (director) =>
              (!configured.has(director.id) ||
                windows.some(
                  (w) =>
                    w.director_id === director.id &&
                    w.starts_at <= interval.startsAt &&
                    w.ends_at >= interval.endsAt,
                )) &&
              !confirmed.some(
                (c) =>
                  c.director_id === director.id &&
                  c.starts_at < interval.endsAt &&
                  c.ends_at > interval.startsAt,
              ) &&
              !daysOff.some(
                (off) =>
                  off.director_id === director.id && date <= off.date && off.date <= lastDate,
              ) &&
              !locks.some(
                (lock) =>
                  lock.director_id === director.id &&
                  lock.date === date &&
                  needed.includes(lock.time),
              ) &&
              !occupied.some(
                (booking) =>
                  booking.directorId === director.id &&
                  Date.parse(booking.startsAt) < Date.parse(interval.endsAt) &&
                  Date.parse(booking.endsAt) > Date.parse(interval.startsAt),
              ),
          );
          return { time, available };
        }),
      };
    }),
  };
}
