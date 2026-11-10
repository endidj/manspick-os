// 후기 제출과 운영 요청 처리를 검사하고 원본 공개 여부를 결정합니다.
import { DomainError, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { operator, customer } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareFollowUp(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';

  switch (type) {
    case 'review_submit': {
      customer(actor);
      const uploadId = requiredText(body, 'uploadId', 100);
      if (
        await first(
          env,
          "SELECT id FROM requests WHERE shoot_id=? AND type='review' AND state='complete'",
          shootId,
        )
      )
        throw new DomainError('ALREADY_REVIEWED', '이미 확인이 완료된 후기입니다.', 409);
      if (statusInfo(shoot.status).order < statusInfo('delivered').order)
        throw new DomainError('REVIEW_NOT_OPEN', '결과 전달 후 후기를 제출해주세요.', 409);
      if (
        !(await first(
          env,
          "SELECT id FROM uploads WHERE id=? AND shoot_id=? AND kind='review'",
          uploadId,
          shootId,
        ))
      )
        throw new DomainError('INVALID_UPLOAD', '본인 촬영의 후기 캡처를 업로드해주세요.');
      statements.push(
        statement(
          env,
          "INSERT INTO requests(id,shoot_id,type,message,upload_id) VALUES(?,?,'review',?,?)",
          id(),
          shootId,
          typeof body.message === 'string' ? body.message.slice(0, 1000) : '후기 확인 요청',
          uploadId,
        ),
      );
      to = 'review_pending';
      reason = '고객 후기 캡처 제출';
      break;
    }
    case 'resolve_request': {
      operator(actor);
      const requestId = requiredText(body, 'requestId', 100);
      const decision = requiredText(body, 'decision', 20);
      if (!['complete', 'reject'].includes(decision))
        throw new DomainError('INVALID_DECISION', '처리 결과를 확인해주세요.');
      const request = await first<{ type: string; state: string }>(
        env,
        'SELECT type,state FROM requests WHERE id=? AND shoot_id=?',
        requestId,
        shootId,
      );
      if (!request) throw new DomainError('NOT_FOUND', '요청을 찾을 수 없습니다.', 404);
      if (!['new', 'processing'].includes(request.state))
        throw new DomainError('REQUEST_CLOSED', '이미 처리된 요청입니다.', 409);
      if (request.type === 'deposit' && decision === 'complete')
        throw new DomainError('USE_PAYMENT', '결제 확인 동작으로 입금을 확인해주세요.');
      statements.push(
        statement(
          env,
          'UPDATE requests SET state=?,handled_by=? WHERE id=?',
          decision === 'complete' ? 'complete' : 'rejected',
          actor.id,
          requestId,
        ),
      );
      if (request.type === 'review' && decision === 'complete') {
        if (
          !(await first(
            env,
            "SELECT id FROM uploads WHERE shoot_id=? AND kind='original' UNION ALL SELECT id FROM external_file_links WHERE shoot_id=? AND kind='original' LIMIT 1",
            shootId,
            shootId,
          ))
        )
          throw new DomainError(
            'ORIGINAL_REQUIRED',
            '공개할 원본 파일을 먼저 업로드해주세요.',
            409,
          );
        // 후기는 캠페인 없이도 승인하며, 지정된 혜택이 활성일 때만 신청을 저장합니다.
        statements.push(
          statement(
            env,
            `INSERT INTO campaign_claims(id,campaign_id,shoot_id,request_id)
             SELECT ?,id,?,? FROM campaigns WHERE active=1
               AND id=COALESCE((SELECT id FROM campaigns WHERE id='review'),'review-demo')`,
            id(),
            shootId,
            requestId,
          ),
        );
        statements.push(
          statement(
            env,
            "UPDATE uploads SET visible=1 WHERE shoot_id=? AND kind='original'",
            shootId,
          ),
        );
        statements.push(
          statement(
            env,
            "UPDATE external_file_links SET visible=1,published_at=COALESCE(published_at,?) WHERE shoot_id=? AND kind='original'",
            new Date().toISOString(),
            shootId,
          ),
        );
        to = 'originals_delivered';
        statements.push(notification(env, shootId, 'originals_open', '후기 확인 후 원본 공개'));
      }
      reason = `운영 요청 ${decision === 'complete' ? '완료' : '반려'}`;
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason };
}
