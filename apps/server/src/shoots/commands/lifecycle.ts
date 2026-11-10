// 촬영 상태 변경과 내부 메모, 예약 취소 및 만료 처리를 준비합니다.
import { assertTransition, DomainError } from '@manspick/domain';
import type { ShootStatus, StaffRole } from '@manspick/domain';
import { expiredHold, HOLD_RELEASE_REASON, releaseHoldStatements } from '../../booking/holds.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { operator, director } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareLifecycle(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body, now } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';
  let condition: PreparedCommand['condition'];
  switch (type) {
    case 'change_status': {
      if (actor.kind !== 'staff')
        throw new DomainError('FORBIDDEN', '직원 권한이 필요합니다.', 403);
      if (
        actor.role === 'retoucher' &&
        !(await first(
          env,
          "SELECT id FROM retouch_jobs WHERE shoot_id=? AND retoucher_id=? AND state!='complete'",
          shootId,
          actor.id,
        ))
      )
        throw new DomainError('JOB_REQUIRED', '본인에게 배정된 진행 중 작업이 없습니다.', 409);
      to = requiredText(body, 'status', 40) as ShootStatus;
      if (to === 'cancelled')
        throw new DomainError('USE_CANCEL', '취소 동작에서 사유를 입력해주세요.');
      reason = typeof body.reason === 'string' ? body.reason.slice(0, 1000) : '';
      assertTransition(shoot.status, to, actor.role as StaffRole, reason);
      if (to === shoot.status) return null;
      if (
        ['selection_complete', 'retouch_assigned', 'retouching'].includes(to) &&
        !(await first(env, 'SELECT id FROM selections WHERE shoot_id=?', shootId))
      )
        throw new DomainError('SELECTION_REQUIRED', '셀렉 제출 후 진행해주세요.', 409);
      if (
        to === 'delivered' &&
        !(await first(
          env,
          "SELECT id FROM photos WHERE shoot_id=? AND kind IN ('retouched','revision')",
          shootId,
        ))
      )
        throw new DomainError('RESULT_REQUIRED', '보정 결과를 먼저 업로드해주세요.', 409);
      if (to === 'selection_pending')
        throw new DomainError('USE_SELECTION', '후보 공개 동작으로 셀렉을 열어주세요.');
      if (to === 'delivered')
        throw new DomainError('USE_RETOUCH', '보정 완료 동작으로 현재 작업 결과를 공개해주세요.');
      reason ||= '정상 상태 진행';
      break;
    }
    case 'note': {
      director(actor);
      const text = requiredText(body, 'text', 4000);
      statements.push(
        statement(
          env,
          'INSERT INTO notes(id,shoot_id,text,author_id) VALUES(?,?,?,?)',
          id(),
          shootId,
          text,
          actor.id,
        ),
      );
      reason = '내부 메모 추가';
      break;
    }
    case 'cancel': {
      operator(actor);
      reason = requiredText(body, 'reason', 1000);
      to = 'cancelled';
      statements.push(statement(env, 'DELETE FROM slots WHERE shoot_id=?', shootId));
      statements.push(
        statement(
          env,
          'UPDATE shoots SET cancelled_at=?,cancelled_reason=?,director_id=NULL WHERE id=?',
          now,
          reason,
          shootId,
        ),
      );
      statements.push(
        statement(
          env,
          "UPDATE notifications SET state='cancelled' WHERE shoot_id=? AND state='local_pending'",
          shootId,
        ),
      );
      statements.push(
        statement(
          env,
          "UPDATE payments SET state='released',held_until=NULL WHERE shoot_id=? AND state='pending'",
          shootId,
        ),
      );
      reason = `취소: ${reason} · 과거 담당 ${shoot.director_id ?? '없음'} · 환불 처리 아님`;
      break;
    }
    case 'release_hold': {
      operator(actor);
      condition = {
        sql: `EXISTS(SELECT 1 FROM shoots s WHERE s.id=? AND ${expiredHold})`,
        values: [shootId, now],
      };
      if (!(await first(env, `SELECT 1 WHERE ${condition.sql}`, ...condition.values)))
        throw new DomainError('HOLD_NOT_EXPIRED', '아직 만료되지 않은 예약 대기입니다.', 409);
      statements.push(...releaseHoldStatements(env, shootId));
      to = 'calendar_pending';
      reason = HOLD_RELEASE_REASON;
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason, condition };
}
