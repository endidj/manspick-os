// 희망 일시별 촬영·점유 구간과 디렉터의 확정 가능 조건을 계산합니다.
import { DomainError, requiredSlots, validateBookingDate } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import { first, rows } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { directorSkillsCondition } from './directors.ts';
import { reclaimableHold } from './holds.ts';
import { operationsPolicy } from '../settings/operations-policy.ts';
import {
  conflictingReservations,
  lastOccupiedDate,
  occupiedInterval,
  overlapsOccupiedShoot,
} from './reservations.ts';

export function requestedTimes(body: Record<string, unknown>, now: Date, policy: OperationsPolicy) {
  const multiple = body.timeOptions !== undefined;
  const input = multiple ? body.timeOptions : [body];
  if (
    !Array.isArray(input) ||
    input.length < 1 ||
    input.length > policy.bookingHorizonWeeks * 7 * policy.slotTimes.length
  )
    throw new DomainError('INVALID_TIME_OPTIONS', '서로 다른 희망 일시를 선택해주세요.');
  const seen = new Set<string>();
  return input.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw new DomainError('INVALID_TIME_OPTIONS', '희망 일시를 확인해주세요.');
    const value = entry as Record<string, unknown>;
    const date = requiredText(value, 'date', 10);
    const time = requiredText(value, 'time', 5);
    validateBookingDate(date, now, policy);
    if (seen.has(date + time))
      throw new DomainError('INVALID_TIME_OPTIONS', '중복된 희망 일시입니다.');
    seen.add(date + time);
    return { date, time };
  });
}

export function scheduleOption(
  date: string,
  time: string,
  packageId: string,
  duration: number,
  shopping: boolean,
  policy: OperationsPolicy,
) {
  const slots = requiredSlots(packageId, time, shopping, policy);
  const startsAt = new Date(`${date}T${time}:00+09:00`).toISOString();
  const endsAt = new Date(Date.parse(startsAt) + duration * 60_000).toISOString();
  const interval = occupiedInterval({ startsAt, endsAt }, date, slots);
  if (packageId === 'allday')
    interval.endsAt = new Date(
      Math.max(Date.parse(interval.endsAt), Date.parse(`${date}T19:00:00+09:00`)),
    ).toISOString();
  return { packageId, date, time, slots, startsAt, endsAt, interval };
}

export type AssignmentSlot = Pick<
  ReturnType<typeof scheduleOption>,
  'packageId' | 'date' | 'slots' | 'interval'
>;

function matchingSlots(
  directorId: string,
  slots: AssignmentSlot[],
  addonIds: string[],
  exceptShootId: string,
  ignoreExpiredAt?: string,
) {
  const skills = directorSkillsCondition(slots[0]!.packageId, addonIds);
  const candidates = slots.map(({ date, slots: times, interval }) => ({
    date,
    lastDate: lastOccupiedDate(date, interval),
    times,
    ...interval,
  }));
  return {
    sql: `WITH owner(director,booking) AS (VALUES(?,?)),
      options(position,day,last_day,times,starts,ends) AS (
        SELECT key,value->>'$.date',value->>'$.lastDate',value->'$.times',
               value->>'$.startsAt',value->>'$.endsAt' FROM json_each(?))
      SELECT d.position FROM options d CROSS JOIN owner a
      WHERE EXISTS(SELECT 1 FROM staff WHERE id=a.director AND role='director' AND active=1 AND ${skills.sql})
      AND NOT EXISTS(SELECT 1 FROM director_days_off WHERE director_id=a.director AND date BETWEEN d.day AND d.last_day)
      AND (NOT EXISTS(SELECT 1 FROM director_availability WHERE director_id=a.director) OR
        EXISTS(SELECT 1 FROM director_availability WHERE director_id=a.director AND starts_at<=d.starts AND ends_at>=d.ends))
      AND NOT EXISTS(SELECT 1 FROM slots l JOIN shoots s ON s.id=l.shoot_id
        WHERE l.director_id=a.director AND l.shoot_id!=a.booking AND l.date=d.day AND l.time IN (SELECT value FROM json_each(d.times))
        ${ignoreExpiredAt ? `AND NOT ${reclaimableHold}` : ''})
      AND NOT EXISTS(SELECT 1 FROM shoots s WHERE s.director_id=a.director AND s.status!='cancelled' AND s.id!=a.booking
        AND ${overlapsOccupiedShoot('d.ends', 'd.starts')} ${ignoreExpiredAt ? `AND NOT ${reclaimableHold}` : ''})
      AND NOT EXISTS(SELECT 1 FROM booking_confirmations c JOIN shoots s ON s.id=c.booking_id
        WHERE s.director_id=a.director AND s.status!='cancelled' AND c.booking_id!=a.booking AND c.occupancy_starts_at<d.ends AND c.occupancy_ends_at>d.starts)`,
    values: [
      directorId,
      exceptShootId,
      JSON.stringify(candidates),
      ...skills.values,
      ...(ignoreExpiredAt ? [ignoreExpiredAt, ignoreExpiredAt] : []),
    ],
  };
}

export function directorAvailability(
  directorId: string,
  option: AssignmentSlot,
  addonIds: string[],
  exceptShootId = '',
) {
  const check = matchingSlots(directorId, [option], addonIds, exceptShootId);
  return {
    conflicts: conflictingReservations(
      directorId,
      option.date,
      option.slots,
      option.interval,
      exceptShootId,
    ),
    sql: `EXISTS(${check.sql})`,
    values: check.values,
  };
}

export async function bookingItemIds(env: Env, shootId: string) {
  const items = await rows<{ id: string }>(
    env,
    'SELECT DISTINCT item_id AS id FROM order_items WHERE order_id=(SELECT order_id FROM bookings WHERE id=?)',
    shootId,
  );
  return items.map((item) => item.id);
}

export function savedOptions(env: Env, shootId: string) {
  return rows<{
    id: string;
    date: string;
    time: string;
    startsAt: string;
    packageId: string;
    duration: number | null;
  }>(
    env,
    `SELECT t.id,date(t.starts_at,'+09:00') AS date,strftime('%H:%M',t.starts_at,'+09:00') AS time,
            t.starts_at AS startsAt,o.package_id AS packageId,o.shoot_duration_minutes AS duration
     FROM booking_time_options t JOIN bookings b ON b.id=t.booking_id JOIN orders o ON o.id=b.order_id
     WHERE t.booking_id=? ORDER BY t.starts_at`,
    shootId,
  );
}

export function schedulableOptions(
  saved: Awaited<ReturnType<typeof savedOptions>>,
  items: string[],
  policy: OperationsPolicy,
  now: string,
) {
  return saved.flatMap(({ id, date, time, packageId, duration, startsAt }) => {
    if (!duration || startsAt <= now) return [];
    try {
      return [
        {
          id,
          slot: scheduleOption(date, time, packageId, duration, items.includes('shopping'), policy),
        },
      ];
    } catch (error) {
      if (error instanceof DomainError && error.code === 'INVALID_SLOT') return [];
      throw error;
    }
  });
}

export async function availableSlots(
  env: Env,
  directorId: string,
  slots: AssignmentSlot[],
  items: string[],
  shootId: string,
  now: string,
) {
  if (!slots.length) return [];
  const check = matchingSlots(directorId, slots, items, shootId, now);
  const open = new Set(
    (await rows<{ position: number }>(env, check.sql, ...check.values)).map((row) => row.position),
  );
  return slots.map((_, index) => open.has(index));
}

export async function bookingSchedule(env: Env, shootId: string, directorId?: string) {
  const [saved, confirmation] = await Promise.all([
    savedOptions(env, shootId),
    first<{ optionId: string; location: string; confirmedAt: string }>(
      env,
      'SELECT option_id AS optionId,location,confirmed_at AS confirmedAt FROM booking_confirmations WHERE booking_id=?',
      shootId,
    ),
  ]);
  const timeOptions = saved.map(({ id, date, time }) => ({ id, date, time }));
  if (!directorId || !timeOptions.length) return { timeOptions, confirmation };
  const [items, policy] = await Promise.all([bookingItemIds(env, shootId), operationsPolicy(env)]);
  const now = new Date().toISOString();
  const candidates = schedulableOptions(saved, items, policy, now);
  const open = await availableSlots(
    env,
    directorId,
    candidates.map((value) => value.slot),
    items,
    shootId,
    now,
  );
  const ids = new Set(candidates.filter((_, index) => open[index]).map((value) => value.id));
  return {
    timeOptions: timeOptions.map((option) => ({ ...option, available: ids.has(option.id) })),
    confirmation,
  };
}
