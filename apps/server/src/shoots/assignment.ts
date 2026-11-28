// 디렉터의 추가서비스·휴무·예약·업무량을 확인하고 사유가 있는 재배정을 준비합니다.
import { datePlusDays, DomainError, koreaDate } from '@manspick/domain';
import type { AssignmentCandidateDTO } from '@manspick/contracts';
import { directorSkillsCondition } from '../booking/directors.ts';
import { releaseExpiredHolds } from '../booking/holds.ts';
import { occupiedInterval } from '../booking/reservations.ts';
import {
  availableSlots,
  bookingItemIds,
  directorAvailability,
  savedOptions,
  schedulableOptions,
} from '../booking/schedule-options.ts';
import type { AssignmentSlot } from '../booking/schedule-options.ts';
import { operationsPolicy } from '../settings/operations-policy.ts';
import { first, rows, statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { operator } from '../security/permissions.ts';
import type { ShootRow } from './access.ts';
import type { CommandContext, PreparedCommand } from './commands/types.ts';

async function assignmentRequirements(env: Env, shoot: ShootRow, now: string) {
  const date = shoot.starts_at ? koreaDate(new Date(shoot.starts_at)) : koreaDate();
  const items = await bookingItemIds(env, shoot.id);
  const skills = directorSkillsCondition(shoot.package_id, items);
  let slots: AssignmentSlot[] = [];
  if (shoot.starts_at && shoot.ends_at) {
    const [locks, confirmed] = await Promise.all([
      rows<{ time: string }>(env, 'SELECT time FROM slots WHERE shoot_id=?', shoot.id),
      first<{ startsAt: string; endsAt: string }>(
        env,
        'SELECT occupancy_starts_at AS startsAt,occupancy_ends_at AS endsAt FROM booking_confirmations WHERE booking_id=?',
        shoot.id,
      ),
    ]);
    const times = locks.map((lock) => lock.time);
    const interval =
      confirmed ??
      occupiedInterval({ startsAt: shoot.starts_at, endsAt: shoot.ends_at }, date, times);
    slots = [{ packageId: shoot.package_id, date, slots: times, interval }];
  } else {
    const saved = await savedOptions(env, shoot.id);
    if (!saved.length) return { date, items, skills, slots, noSchedule: true };
    slots = schedulableOptions(saved, items, await operationsPolicy(env), now).map(
      (option) => option.slot,
    );
  }
  return { date, items, skills, slots, noSchedule: false };
}

export async function assignmentCandidates(
  env: Env,
  shoot: ShootRow,
): Promise<AssignmentCandidateDTO[]> {
  const now = new Date().toISOString();
  const { date, items, skills, slots, noSchedule } = await assignmentRequirements(env, shoot, now);
  const candidates = await rows<{
    id: string;
    name: string;
    hiredOn: string | null;
    skill_eligible: number;
  }>(
    env,
    `SELECT id,name,hired_on AS hiredOn,(${skills.sql}) AS skill_eligible FROM staff WHERE active=1 AND role='director' ORDER BY hired_on IS NULL,hired_on,id`,
    ...skills.values,
  );
  return Promise.all(
    candidates.map(async (person) => {
      const skillEligible = person.skill_eligible === 1;
      const [available, load] = await Promise.all([
        skillEligible &&
          (noSchedule ||
            availableSlots(env, person.id, slots, items, shoot.id, now).then((open) =>
              open.some(Boolean),
            )),
        first<{ n: number }>(
          env,
          'SELECT COUNT(DISTINCT shoot_id) AS n FROM slots WHERE director_id=? AND date>=? AND date<=?',
          person.id,
          datePlusDays(date, -6),
          date,
        ),
      ]);
      return {
        directorId: person.id,
        name: person.name,
        hiredOn: person.hiredOn,
        skillEligible,
        available,
        weeklyLoad: load?.n ?? 0,
        reason: !skillEligible
          ? '패키지 또는 부가서비스 자격 없음'
          : available
            ? '배정 가능'
            : '배정 가능한 일정 없음',
      };
    }),
  );
}

export async function prepareAssignment(context: CommandContext): Promise<PreparedCommand> {
  const { env, actor, shoot, shootId, body } = context;
  operator(actor);
  const reason = requiredText(body, 'reason', 1000);
  const statements: D1PreparedStatement[] = [];
  const clauses: string[] = [];
  const values: (string | number | null)[] = [];
  if (body.directorId !== undefined) {
    const person = requiredText(body, 'directorId', 100);
    const { skills, slots, items, noSchedule } = await assignmentRequirements(
      env,
      shoot,
      context.now,
    );
    let rule: { sql: string; values: (string | number | null)[] } | undefined;
    if (noSchedule) {
      rule = {
        sql: `EXISTS(SELECT 1 FROM staff WHERE id=? AND role='director' AND active=1 AND ${skills.sql})`,
        values: [person, ...skills.values],
      };
    } else {
      const available = await availableSlots(env, person, slots, items, shootId, context.now);
      const selected = slots.find((_, index) => available[index]);
      if (selected) {
        const check = directorAvailability(person, selected, items, shootId);
        await releaseExpiredHolds(env, context.now, check.conflicts);
        rule = check;
      }
    }
    if (!rule || !(await first(env, `SELECT 1 WHERE ${rule.sql}`, ...rule.values)))
      throw new DomainError(
        'ASSIGNMENT_UNAVAILABLE',
        '패키지·부가서비스·일정 조건에 맞는 디렉터를 선택해주세요.',
        409,
      );
    clauses.push(rule.sql);
    values.push(...rule.values);
    statements.push(
      statement(env, 'UPDATE slots SET director_id=? WHERE shoot_id=?', person, shootId),
    );
    statements.push(statement(env, 'UPDATE shoots SET director_id=? WHERE id=?', person, shootId));
  }
  if (body.csId !== undefined) {
    const cs = requiredText(body, 'csId', 100);
    const sql = "EXISTS(SELECT 1 FROM staff WHERE id=? AND role IN ('admin','staff') AND active=1)";
    if (!(await first(env, 'SELECT 1 WHERE ' + sql, cs)))
      throw new DomainError('INVALID_ASSIGNEE', '활성 운영 직원을 선택해주세요.');
    clauses.push(sql);
    values.push(cs);
    statements.push(
      statement(
        env,
        "UPDATE booking_staff SET released_at=? WHERE booking_id=? AND role='cs' AND released_at IS NULL AND staff_id!=?",
        context.now,
        shootId,
        cs,
      ),
      statement(
        env,
        "INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT ?,?,'cs',? WHERE NOT EXISTS(SELECT 1 FROM booking_staff WHERE booking_id=? AND staff_id=? AND role='cs' AND released_at IS NULL)",
        shootId,
        cs,
        context.now,
        shootId,
        cs,
      ),
    );
  }
  if (!statements.length) throw new DomainError('INVALID_INPUT', '변경할 담당자를 선택해주세요.');
  return {
    statements,
    to: shoot.status,
    reason: `담당 수동 변경: ${reason}`,
    condition: { sql: clauses.join(' AND '), values },
  };
}
