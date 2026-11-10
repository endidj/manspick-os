// 고객의 수정 요청과 담당 보정가의 결과 공개를 검사하고 준비합니다.
import { DomainError, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, rows, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { customer, staffCan } from '../../security/permissions.ts';
import { activeRetoucherCondition } from '../assignment.ts';
import { retouchProgress } from '../retouch-results.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function prepareRetouch(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';
  let condition: PreparedCommand['condition'];

  switch (type) {
    case 'request_revision': {
      customer(actor);
      if (statusInfo(shoot.status).order < statusInfo('delivered').order)
        throw new DomainError(
          'RESULT_NOT_DELIVERED',
          '보정 결과 전달 후 수정 요청이 가능합니다.',
          409,
        );
      const items = body.items;
      if (!Array.isArray(items) || items.length < 1 || items.length > 30)
        throw new DomainError('INVALID_ITEMS', '사진별 수정 의견을 입력해주세요.');
      const requestId = id();
      const seen = new Set<string>();
      statements.push(
        statement(
          env,
          "INSERT INTO requests(id,shoot_id,type,message) VALUES(?,?,'revision','고객 사진 수정 요청')",
          requestId,
          shootId,
        ),
      );
      for (const value of items) {
        if (!value || typeof value !== 'object')
          throw new DomainError('INVALID_ITEMS', '수정 의견을 확인해주세요.');
        const item = value as Record<string, unknown>;
        const photoId = requiredText(item, 'photoId', 100);
        const comment = requiredText(item, 'comment', 1000);
        if (seen.has(photoId))
          throw new DomainError('INVALID_ITEMS', '한 컷에 의견을 하나씩 입력해주세요.');
        seen.add(photoId);
        if (
          !(await first(
            env,
            "SELECT id FROM photos WHERE id=? AND shoot_id=? AND visible=1 AND kind IN ('retouched','revision')",
            photoId,
            shootId,
          ))
        )
          throw new DomainError(
            'INVALID_PHOTO',
            '공개된 보정 사진에만 수정 요청을 할 수 있습니다.',
          );
        statements.push(
          statement(
            env,
            'INSERT INTO request_items(id,request_id,photo_id,comment) VALUES(?,?,?,?)',
            id(),
            requestId,
            photoId,
            comment,
          ),
        );
      }
      condition = await activeRetoucherCondition(env, shoot.retoucher_id);
      if (!condition) throw new DomainError('RETOUCHER_REQUIRED', '담당 보정가가 필요합니다.', 409);
      statements.push(
        statement(
          env,
          "INSERT INTO retouch_jobs(id,shoot_id,retoucher_id,kind,request_id,due_at) VALUES(?,?,?,'revision',?,?)",
          id(),
          shootId,
          shoot.retoucher_id,
          requestId,
          new Date(Date.now() + 3 * 86400000).toISOString(),
        ),
      );
      to = 'retouching';
      reason = '고객 수정 요청 접수 · 사진 개수와 관계없이 1회';
      break;
    }
    case 'finish_retouch': {
      if (!staffCan(actor, 'retouch'))
        throw new DomainError('FORBIDDEN', '보정 담당 권한이 필요합니다.', 403);
      if (!['retouch_assigned', 'retouching'].includes(shoot.status))
        throw new DomainError('RETOUCH_STATE', '현재 완료할 보정 작업이 없습니다.', 409);
      const pendingJobs = await rows<{
        id: string;
        kind: string;
        request_id: string | null;
        retoucher_id: string;
      }>(
        env,
        "SELECT id,kind,request_id,retoucher_id FROM retouch_jobs WHERE shoot_id=? AND state!='complete'",
        shootId,
      );
      const ownJobs = pendingJobs.filter(
        (job) => actor.role !== 'retoucher' || job.retoucher_id === actor.id,
      );
      if (!ownJobs.length)
        throw new DomainError('JOB_REQUIRED', '본인에게 배정된 진행 중 작업이 없습니다.', 409);
      const progress = await retouchProgress(env, shootId);
      for (const job of ownJobs) {
        const cuts = progress.get(job.id) ?? [];
        if (!cuts.length)
          throw new DomainError(
            'RESULT_CUTS_MISSING',
            '이 작업에 연결된 요청 컷이 없습니다. 운영자에게 확인해주세요.',
          );
        const resultIds = cuts.flatMap((cut) => (cut.resultId ? [cut.resultId] : []));
        if (resultIds.length !== cuts.length)
          throw new DomainError(
            'RESULT_REQUIRED',
            `요청한 ${cuts.length}컷 중 ${cuts.length - resultIds.length}컷에 결과 파일이 필요합니다.`,
          );
        statements.push(
          statement(env, "UPDATE retouch_jobs SET state='complete' WHERE id=?", job.id),
        );
        statements.push(
          statement(
            env,
            'UPDATE photos SET visible=1 WHERE shoot_id=? AND upload_id IN (SELECT value FROM json_each(?))',
            shootId,
            JSON.stringify(resultIds),
          ),
        );
        statements.push(
          statement(
            env,
            'UPDATE uploads SET visible=1 WHERE shoot_id=? AND id IN (SELECT value FROM json_each(?))',
            shootId,
            JSON.stringify(resultIds),
          ),
        );
        if (job.request_id)
          statements.push(
            statement(
              env,
              "UPDATE requests SET state='complete',handled_by=? WHERE id=? AND shoot_id=? AND type IN ('revision','extra_retouch') AND state IN ('new','processing')",
              actor.id,
              job.request_id,
              shootId,
            ),
          );
      }
      if (ownJobs.length === pendingJobs.length) {
        statements.push(
          notification(
            env,
            shootId,
            'results_ready',
            '보정 결과가 공개되었습니다. · 외부 발송 없음',
          ),
        );
        to = 'delivered';
      }
      reason = '담당 보정 작업 완료 및 해당 결과 공개';
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason, condition };
}
