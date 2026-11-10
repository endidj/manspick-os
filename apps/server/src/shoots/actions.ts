// 촬영 접근 권한을 확인하고 명령의 변경 내용을 버전 검사와 함께 한 번만 저장합니다.
import { DomainError } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { timelineStatement } from '../activity/records.ts';
import { mutate } from '../database/mutations.ts';
import { statement } from '../database/statements.ts';
import { requiredText } from '../http/input.ts';
import type { Env } from '../runtime/env.ts';
import { accessibleShoot } from './access.ts';
import { shootDetail } from './queries.ts';
import { prepareLifecycle } from './commands/lifecycle.ts';
import { preparePayment } from './commands/payments.ts';
import { preparePreparation } from './commands/preparation.ts';
import { prepareSelection } from './commands/selection.ts';
import { prepareRetouch } from './commands/retouch.ts';
import { prepareFollowUp } from './commands/follow-up.ts';
import type { PreparedCommand } from './commands/types.ts';
import { prepareWorkspace } from './commands/workspace.ts';
import { prepareAssignment } from './assignment.ts';
import { prepareExtraRetouch } from './commands/extra-retouch.ts';

export async function act(env: Env, actor: Actor, shootId: string, body: Record<string, unknown>) {
  const shoot = await accessibleShoot(env, actor, shootId);
  if (shoot.status === 'cancelled')
    throw new DomainError('CANCELLED', '취소된 촬영은 변경할 수 없습니다.', 409);
  const type = requiredText(body, 'type', 40);
  const now = new Date().toISOString();
  const context = { env, actor, shoot, shootId, body, now };
  let prepared: PreparedCommand | null;
  switch (type) {
    case 'change_status':
    case 'note':
    case 'cancel':
    case 'release_hold':
      prepared = await prepareLifecycle(type, context);
      break;
    case 'confirm_payment':
    case 'request_deposit':
      prepared = await preparePayment(type, context);
      break;
    case 'save_survey':
    case 'share_plan':
      prepared = await preparePreparation(type, context);
      break;
    case 'start_selection':
    case 'submit_selection':
      prepared = await prepareSelection(type, context);
      break;
    case 'request_revision':
    case 'finish_retouch':
      prepared = await prepareRetouch(type, context);
      break;
    case 'review_submit':
    case 'resolve_request':
      prepared = await prepareFollowUp(type, context);
      break;
    case 'save_preparation':
    case 'mark_preparation_read':
    case 'confirm_preparation':
    case 'save_field_checklist':
    case 'complete_field':
    case 'save_file_link':
      prepared = await prepareWorkspace(type, context);
      break;
    case 'assign_staff':
      prepared = await prepareAssignment(context);
      break;
    case 'request_extra_retouch':
      prepared = await prepareExtraRetouch(context);
      break;
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  if (!prepared) return shootDetail(env, actor, shootId);
  const { statements, to, reason, condition } = prepared;
  statements.push(statement(env, 'UPDATE shoots SET status=? WHERE id=?', to, shootId));
  statements.push(timelineStatement(env, shootId, actor, shoot.status, to, reason));
  await mutate(env, shoot, statements, condition);
  return shootDetail(env, actor, shootId);
}
