// 디렉터의 추가서비스·휴무·예약·업무량을 확인하고 사유가 있는 재배정을 준비합니다.
import { datePlusDays, DomainError, koreaDate } from '@manspick/domain';
import type { AssignmentCandidateDTO } from '@manspick/contracts';
import { directorSkillsCondition } from '../booking/directors.ts';
import { reclaimableHold, releaseExpiredHolds } from '../booking/holds.ts';
import {
  conflictingReservations,
  lastOccupiedDate,
  occupiedInterval,
} from '../booking/reservations.ts';
import { first, rows, statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { operator } from '../security/permissions.ts';
import type { ShootRow } from './access.ts';
import type { CommandContext, PreparedCommand } from './commands/types.ts';

async function assignmentRequirements(env: Env, shoot: ShootRow) {
  const date = shoot.starts_at ? koreaDate(new Date(shoot.starts_at)) : koreaDate();
  const [locks, addons] = await Promise.all([
    rows<{ time: string }>(env, 'SELECT time FROM slots WHERE shoot_id=?', shoot.id),
    rows<{ addon_id: string }>(env, 'SELECT addon_id FROM shoot_addons WHERE shoot_id=?', shoot.id),
  ]);
  const times = locks.map((lock) => lock.time);
  const interval =
    shoot.starts_at && shoot.ends_at
      ? occupiedInterval({ startsAt: shoot.starts_at, endsAt: shoot.ends_at }, date, times)
      : null;
  return {
    date,
    times,
    interval,
    lastDate: lastOccupiedDate(date, interval),
    skills: directorSkillsCondition(addons.map(({ addon_id }) => addon_id)),
  };
}

export async function assignmentCandidates(
  env: Env,
  shoot: ShootRow,
): Promise<AssignmentCandidateDTO[]> {
  const now = new Date().toISOString();
  const { date, times, interval, lastDate, skills } = await assignmentRequirements(env, shoot);
  const candidates = await rows<{ id: string; name: string; skill_eligible: number }>(
    env,
    `SELECT id,name,${skills.sql} AS skill_eligible FROM staff WHERE active=1 AND role='director' ORDER BY id`,
    skills.value,
  );
  return Promise.all(
    candidates.map(async (person) => {
      const conflicts = conflictingReservations(person.id, date, times, interval, shoot.id);
      const [off, occupied, load] = await Promise.all([
        first(
          env,
          'SELECT date FROM director_days_off WHERE director_id=? AND date BETWEEN ? AND ?',
          person.id,
          date,
          lastDate,
        ),
        first(
          env,
          `SELECT s.id FROM shoots s WHERE ${conflicts.sql} AND NOT ${reclaimableHold} LIMIT 1`,
          ...conflicts.values,
          now,
        ),
        first<{ n: number }>(
          env,
          'SELECT COUNT(DISTINCT shoot_id) AS n FROM slots WHERE director_id=? AND date>=? AND date<=?',
          person.id,
          datePlusDays(date, -6),
          date,
        ),
      ]);
      const skillEligible = person.skill_eligible === 1;
      const available = !off && !occupied;
      return {
        directorId: person.id,
        name: person.name,
        skillEligible,
        available,
        weeklyLoad: load?.n ?? 0,
        reason: !skillEligible
          ? '추가서비스 불가'
          : off
            ? '휴무'
            : !available
              ? '다른 예약과 시간 중복'
              : '배정 가능',
      };
    }),
  );
}

export async function activeRetoucherCondition(env: Env, retoucherId: string | null) {
  if (!retoucherId) return;
  const sql = "EXISTS(SELECT 1 FROM staff WHERE id=? AND role='retoucher' AND active=1)";
  const values = [retoucherId];
  if (await first(env, `SELECT 1 WHERE ${sql}`, ...values)) return { sql, values };
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
    const { date, times, interval, lastDate, skills } = await assignmentRequirements(env, shoot);
    const conflicts = conflictingReservations(person, date, times, interval, shootId);
    await releaseExpiredHolds(env, context.now, conflicts);
    const checks = [
      `EXISTS(SELECT 1 FROM staff WHERE id=? AND role='director' AND active=1 AND ${skills.sql})`,
      'NOT EXISTS(SELECT 1 FROM director_days_off WHERE director_id=? AND date BETWEEN ? AND ?)',
      `NOT EXISTS(SELECT 1 FROM shoots s WHERE ${conflicts.sql})`,
    ];
    const bindings = [person, skills.value, person, date, lastDate, ...conflicts.values];
    const candidate = await first(env, `SELECT 1 WHERE ${checks.join(' AND ')}`, ...bindings);
    if (!candidate)
      throw new DomainError(
        'ASSIGNMENT_UNAVAILABLE',
        '추가서비스·휴무·예약 조건에 맞는 디렉터를 선택해주세요.',
        409,
      );
    clauses.push(...checks);
    values.push(...bindings);
    statements.push(
      statement(env, 'UPDATE slots SET director_id=? WHERE shoot_id=?', person, shootId),
    );
    statements.push(statement(env, 'UPDATE shoots SET director_id=? WHERE id=?', person, shootId));
  }
  if (body.retoucherId !== undefined) {
    const person = requiredText(body, 'retoucherId', 100);
    const retoucher = await activeRetoucherCondition(env, person);
    if (!retoucher) throw new DomainError('INVALID_ASSIGNEE', '활성 보정가를 선택해주세요.');
    clauses.push(retoucher.sql);
    values.push(...retoucher.values);
    statements.push(statement(env, 'UPDATE shoots SET retoucher_id=? WHERE id=?', person, shootId));
    statements.push(
      statement(
        env,
        "UPDATE retouch_jobs SET retoucher_id=? WHERE shoot_id=? AND state!='complete'",
        person,
        shootId,
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
