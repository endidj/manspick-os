// 운영자가 해당 예약의 미처리 입금 신고를 반려합니다. 수납 확정은 별도 명령을 사용합니다.
import { DomainError } from '@manspick/domain';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { operator } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareFollowUp(
  _type: string,
  { env, actor, shoot, shootId, body }: CommandContext,
): Promise<PreparedCommand> {
  operator(actor);
  const requestId = requiredText(body, 'requestId', 100);
  const decision = requiredText(body, 'decision', 20);
  if (!['complete', 'reject'].includes(decision))
    throw new DomainError('INVALID_DECISION', '처리 결과를 확인해주세요.');
  const request = await first<{ state: string }>(
    env,
    "SELECT state FROM requests WHERE id=? AND shoot_id=? AND type='deposit'",
    requestId,
    shootId,
  );
  if (!request) throw new DomainError('NOT_FOUND', '이 예약의 입금 신고를 찾을 수 없습니다.', 404);
  if (!['new', 'processing'].includes(request.state))
    throw new DomainError('REQUEST_CLOSED', '이미 처리된 신고입니다.', 409);
  if (decision === 'complete')
    throw new DomainError('USE_PAYMENT', '결제 확인 동작으로 입금을 확인해주세요.');
  return {
    to: shoot.status,
    reason: '입금 신고 반려',
    statements: [
      statement(
        env,
        "UPDATE requests SET state='rejected',handled_by=? WHERE id=? AND shoot_id=?",
        actor.id,
        requestId,
        shootId,
      ),
    ],
  };
}
