// 배정된 디렉터가 제출된 후보 하나의 시간·장소를 확정합니다.
import { deadline, DomainError, statusInfo } from '@manspick/domain';
import { releaseExpiredHolds } from '../../booking/holds.ts';
import {
  bookingItemIds,
  directorAvailability,
  scheduleOption,
} from '../../booking/schedule-options.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { operationsPolicy } from '../../settings/operations-policy.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareScheduleConfirmation(
  context: CommandContext,
): Promise<PreparedCommand> {
  const { env, actor, shoot, shootId, body, now } = context;
  if (actor.kind !== 'staff' || actor.role !== 'director' || shoot.director_id !== actor.id)
    throw new DomainError('FORBIDDEN', '배정된 디렉터만 일정을 확정할 수 있습니다.', 403);
  const optionId = requiredText(body, 'optionId', 100);
  const location = requiredText(body, 'location', 500);
  const previous =
    body.previousOptionId === undefined ? null : requiredText(body, 'previousOptionId', 100);
  if (statusInfo(shoot.status).stage >= 5)
    throw new DomainError('SCHEDULE_CLOSED', '촬영 시작 전까지 일정을 변경할 수 있습니다.', 409);
  const option = await first<{ date: string; time: string; duration: number }>(
    env,
    `SELECT date(t.starts_at,'+09:00') AS date,strftime('%H:%M',t.starts_at,'+09:00') AS time,
     o.shoot_duration_minutes AS duration FROM booking_time_options t JOIN bookings b ON b.id=t.booking_id JOIN orders o ON o.id=b.order_id
     WHERE t.id=? AND t.booking_id=? AND t.starts_at>?`,
    optionId,
    shootId,
    now,
  );
  if (!option || !option.duration)
    throw new DomainError(
      'INVALID_TIME_OPTION',
      '이 예약에서 제출한 미래의 희망 일시를 선택해주세요.',
      409,
    );
  const ids = await bookingItemIds(env, shootId);
  const policy = await operationsPolicy(env);
  const chosen = scheduleOption(
    option.date,
    option.time,
    shoot.package_id,
    option.duration,
    ids.includes('shopping'),
    policy,
  );
  const rule = directorAvailability(actor.id, chosen, ids, shootId);
  await releaseExpiredHolds(env, now, rule.conflicts);
  const condition = {
    sql: `${rule.sql} AND EXISTS(SELECT 1 FROM booking_staff WHERE booking_id=? AND staff_id=? AND role='director' AND released_at IS NULL)
      AND (SELECT option_id FROM booking_confirmations WHERE booking_id=?) IS ?
      AND EXISTS(SELECT 1 FROM surveys WHERE shoot_id=? AND submitted_at IS NOT NULL)`,
    values: [...rule.values, shootId, actor.id, shootId, previous, shootId],
  };
  if (!(await first(env, `SELECT 1 WHERE ${condition.sql}`, ...condition.values)))
    throw new DomainError(
      'CONFIRMATION_UNAVAILABLE',
      '설문 제출, 기존 확정 여부와 담당자의 가능 시간을 확인해주세요.',
      409,
    );
  return {
    condition,
    to: previous ? shoot.status : 'preparing',
    reason: '담당 디렉터가 촬영 일시와 장소 확정',
    statements: [
      ...(previous ? [statement(env, 'DELETE FROM slots WHERE shoot_id=?', shootId)] : []),
      statement(
        env,
        `INSERT INTO booking_confirmations(booking_id,option_id,confirmed_by_staff_id,location,confirmed_at,occupancy_starts_at,occupancy_ends_at)
       VALUES(?,?,?,?,?,?,?) ON CONFLICT(booking_id) DO UPDATE SET option_id=excluded.option_id,confirmed_by_staff_id=excluded.confirmed_by_staff_id,location=excluded.location,confirmed_at=excluded.confirmed_at,occupancy_starts_at=excluded.occupancy_starts_at,occupancy_ends_at=excluded.occupancy_ends_at`,
        shootId,
        optionId,
        actor.id,
        location,
        now,
        chosen.interval.startsAt,
        chosen.interval.endsAt,
      ),
      statement(
        env,
        `UPDATE shoots SET starts_at=?,ends_at=?,survey_due_at=?,outfit_due_at=? WHERE id=?`,
        chosen.startsAt,
        chosen.endsAt,
        deadline(chosen.startsAt, policy.surveyLeadDays, new Date(now)),
        deadline(chosen.startsAt, policy.outfitLeadDays, new Date(now)),
        shootId,
      ),
      ...chosen.slots.map((time) =>
        statement(
          env,
          'INSERT INTO slots(id,director_id,date,time,shoot_id) VALUES(?,?,?,?,?)',
          id(),
          actor.id,
          option.date,
          time,
          shootId,
        ),
      ),
      statement(
        env,
        'INSERT INTO shoot_places(id,shoot_id,label,visible) VALUES(?,?,?,1)',
        id(),
        shootId,
        location,
      ),
    ],
  };
}
