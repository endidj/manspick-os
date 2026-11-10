// 디렉터의 휴무와 이미 잡힌 시간을 반영해 예약 가능 일정을 보여줍니다.
import {
  datePlusDays,
  DomainError,
  koreaDate,
  requiredSlots,
  holdExpiry,
  resolveCatalogPackage,
} from '@manspick/domain';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { directors } from './directors.ts';
import { reclaimableHold } from './holds.ts';
import { lastOccupiedDate, occupiedInterval, reservedIntervals } from './reservations.ts';
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
  const selectedIds = [...new Set([...addonIds, ...(shopping ? ['shopping'] : [])])];
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
  const [locks, daysOff, occupied] = await Promise.all([
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
  ]);
  return {
    policy,
    days: Array.from({ length: dayCount }, (_, index) => {
      const date = datePlusDays(today, index + 1);
      return {
        date,
        slots: policy.slotTimes.map((time) => {
          const startsAt = new Date(`${date}T${time}:00+09:00`);
          let needed: string[];
          try {
            needed = requiredSlots(packageId, time, shopping, policy);
            holdExpiry(now, startsAt, policy);
          } catch {
            return { time, available: false };
          }
          const interval = occupiedInterval(
            {
              startsAt: startsAt.toISOString(),
              endsAt: new Date(startsAt.getTime() + pack.duration * 60000).toISOString(),
            },
            date,
            needed,
          );
          const lastDate = lastOccupiedDate(date, interval);
          const available = eligible.some(
            (director) =>
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
