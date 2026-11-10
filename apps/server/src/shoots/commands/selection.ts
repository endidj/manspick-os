// 사진 후보 공개와 고객의 사진 선택 제출을 검사하고 준비합니다.
import { DomainError, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, statement } from '../../database/statements.ts';
import { id } from '../../security/crypto.ts';
import { customer, director } from '../../security/permissions.ts';
import { parseJSON } from '../../shared/json.ts';
import { activeRetoucherCondition } from '../assignment.ts';
import type { CommandContext, PreparedCommand } from './types.ts';
import { allCandidatesSelectable, retouchOrder } from './extra-retouch.ts';

export async function prepareSelection(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body, now } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';
  let condition: PreparedCommand['condition'];

  switch (type) {
    case 'start_selection': {
      director(actor);
      if (statusInfo(shoot.status).order < statusInfo('shoot_complete').order)
        throw new DomainError('SHOOT_NOT_COMPLETE', '촬영 완료 후 후보를 공개해주세요.', 409);
      if (
        !(await first(env, "SELECT id FROM photos WHERE shoot_id=? AND kind='candidate'", shootId))
      )
        throw new DomainError('PHOTOS_REQUIRED', '후보 사진을 먼저 업로드해주세요.');
      if (await first(env, 'SELECT id FROM selections WHERE shoot_id=?', shootId))
        throw new DomainError('ALREADY_SELECTED', '이미 제출된 셀렉이 있습니다.', 409);
      statements.push(
        statement(
          env,
          "UPDATE photos SET visible=1 WHERE shoot_id=? AND kind='candidate'",
          shootId,
        ),
      );
      statements.push(
        statement(
          env,
          "UPDATE uploads SET visible=1 WHERE shoot_id=? AND kind='candidate'",
          shootId,
        ),
      );
      statements.push(
        notification(env, shootId, 'selection_open', '사진 셀렉이 열렸습니다. · 외부 발송 없음'),
      );
      to = 'selection_pending';
      reason = '담당자 후보 공개 및 셀렉 열기';
      break;
    }
    case 'submit_selection': {
      const confirmation = await first<{ selection_confirmed_at: string | null }>(
        env,
        'SELECT selection_confirmed_at FROM shoot_workspace WHERE shoot_id=?',
        shootId,
      );
      const byDirector =
        Boolean(confirmation?.selection_confirmed_at) && shoot.select_by === 'director';
      if (actor.kind === 'customer') {
        customer(actor);
        if (byDirector)
          throw new DomainError(
            'DIRECTOR_SELECTION',
            '현장에서 확정한 디렉터가 셀렉을 진행합니다.',
            403,
          );
      } else {
        director(actor);
        if (!byDirector)
          throw new DomainError(
            'CUSTOMER_SELECTION',
            '고객 셀렉을 대신 제출할 수 없습니다. 현장 확정을 확인해주세요.',
            403,
          );
      }
      if (shoot.status !== 'selection_pending')
        throw new DomainError('SELECTION_CLOSED', '현재 셀렉을 제출할 수 없습니다.', 409);
      const photoIds = body.photoIds;
      const pack = parseJSON<{ retouchCount: number }>(shoot.package_snapshot, { retouchCount: 5 });
      if (
        !Array.isArray(photoIds) ||
        photoIds.length < 1 ||
        photoIds.length > 100 ||
        photoIds.some((photo) => typeof photo !== 'string') ||
        new Set(photoIds).size !== photoIds.length
      )
        throw new DomainError(
          'SELECTION_COUNT',
          '1~100장의 사진을 선택해주세요. 기본 수량 초과분에는 안내된 추가 보정 단가가 적용됩니다.',
        );
      if (!(await allCandidatesSelectable(env, shootId, photoIds)))
        throw new DomainError('INVALID_PHOTO', '선택할 수 없는 사진입니다.');
      condition = await activeRetoucherCondition(env, shoot.retoucher_id);
      if (!condition)
        throw new DomainError('RETOUCHER_REQUIRED', '운영자에게 보정가 배정을 요청해주세요.', 409);
      statements.push(
        statement(
          env,
          "INSERT INTO selections(id,shoot_id,round,picks_json,submitted_at) VALUES(?,?,'base',?,?)",
          id(),
          shootId,
          JSON.stringify(photoIds),
          now,
        ),
      );
      if (photoIds.length > pack.retouchCount) {
        statements.push(
          ...(await retouchOrder(
            context,
            photoIds as string[],
            photoIds.length - pack.retouchCount,
            'base',
          )),
        );
        to = 'selection_complete';
        reason = '셀렉 제출 · 추가 보정 입금 확인 대기';
        break;
      }
      statements.push(
        statement(
          env,
          "INSERT INTO retouch_jobs(id,shoot_id,retoucher_id,kind,due_at) VALUES(?,?,?,'base',?)",
          id(),
          shootId,
          shoot.retoucher_id,
          new Date(Date.now() + 3 * 86400000).toISOString(),
        ),
      );
      to = 'retouch_assigned';
      reason = `${byDirector ? '현장 확정 디렉터' : '고객'} 셀렉 제출 및 보정 작업 배정`;
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason, condition };
}
