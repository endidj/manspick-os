// 희망 일시별 촬영·점유 구간과 디렉터의 확정 가능 조건을 계산합니다.
import { DomainError, requiredSlots, validateBookingDate } from '@manspick/domain';
import type { OperationsPolicy } from '@manspick/domain';
import { first, rows } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { directorSkillsCondition } from './directors.ts';
import { conflictingReservations, lastOccupiedDate, occupiedInterval } from './reservations.ts';

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
  return { date, time, slots, startsAt, endsAt, interval };
}

export function directorAvailability(
  directorId: string,
  option: ReturnType<typeof scheduleOption>,
  addonIds: string[],
  exceptShootId = '',
) {
  const { date, slots, interval } = option;
  const conflicts = conflictingReservations(directorId, date, slots, interval, exceptShootId);
  const skills = directorSkillsCondition(addonIds);
  return {
    conflicts,
    sql: `EXISTS(SELECT 1 FROM staff WHERE id=? AND role='director' AND active=1 AND ${skills.sql})
      AND NOT EXISTS(SELECT 1 FROM director_days_off WHERE director_id=? AND date BETWEEN ? AND ?)
      AND (NOT EXISTS(SELECT 1 FROM director_availability WHERE director_id=?) OR
        EXISTS(SELECT 1 FROM director_availability WHERE director_id=? AND starts_at<=? AND ends_at>=?))
      AND NOT EXISTS(SELECT 1 FROM shoots s WHERE ${conflicts.sql})
      AND NOT EXISTS(SELECT 1 FROM booking_confirmations c JOIN shoots s ON s.id=c.booking_id
        WHERE s.director_id=? AND s.status!='cancelled' AND c.booking_id!=? AND c.occupancy_starts_at<? AND c.occupancy_ends_at>?)`,
    values: [
      directorId,
      skills.value,
      directorId,
      date,
      lastOccupiedDate(date, interval),
      directorId,
      directorId,
      interval.startsAt,
      interval.endsAt,
      ...conflicts.values,
      directorId,
      exceptShootId,
      interval.endsAt,
      interval.startsAt,
    ],
  };
}

export async function bookingSchedule(env: Env, shootId: string) {
  const [timeOptions, confirmation] = await Promise.all([
    rows<{ id: string; date: string; time: string }>(
      env,
      "SELECT id,date(starts_at,'+09:00') AS date,strftime('%H:%M',starts_at,'+09:00') AS time FROM booking_time_options WHERE booking_id=? ORDER BY starts_at",
      shootId,
    ),
    first<{ optionId: string; location: string; confirmedAt: string }>(
      env,
      'SELECT option_id AS optionId,location,confirmed_at AS confirmedAt FROM booking_confirmations WHERE booking_id=?',
      shootId,
    ),
  ]);
  return { timeOptions, confirmation };
}
