// 고객 설문과 담당자의 촬영 설계를 검사하고 저장할 내용을 준비합니다.
import { DomainError, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import { notification } from '../../activity/records.ts';
import { first, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { customer, director } from '../../security/permissions.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

export async function preparePreparation(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand | null> {
  const { env, actor, shoot, shootId, body, now } = context;
  const statements: D1PreparedStatement[] = [];
  let to: ShootStatus = context.shoot.status;
  let reason = '';

  switch (type) {
    case 'save_survey': {
      customer(actor);
      if (shoot.payment_state !== 'confirmed' || statusInfo(shoot.status).stage > 4)
        throw new DomainError(
          'SURVEY_CLOSED',
          '결제 확인 후 촬영 준비 단계에서 작성할 수 있습니다.',
          409,
        );
      const existingSurvey = await first<{ submitted_at: string | null }>(
        env,
        'SELECT submitted_at FROM surveys WHERE shoot_id=?',
        shootId,
      );
      if (existingSurvey?.submitted_at && shoot.survey_due_at && shoot.survey_due_at < now)
        throw new DomainError(
          'SURVEY_CLOSED',
          '설문 편집 기한이 지났습니다. 담당자에게 문의해주세요.',
          409,
        );
      const answers = body.answers;
      const pageDone = body.pageDone;
      if (
        !answers ||
        typeof answers !== 'object' ||
        Array.isArray(answers) ||
        !Array.isArray(pageDone) ||
        pageDone.some((page) => !Number.isInteger(page) || Number(page) < 1 || Number(page) > 4)
      )
        throw new DomainError('INVALID_SURVEY', '설문 입력을 확인해주세요.');
      const pages = [...new Set(pageDone as number[])];
      if (body.submit === true) {
        if (pages.length !== 4)
          throw new DomainError('SURVEY_INCOMPLETE', '4개 페이지를 모두 작성해주세요.');
        const answer = answers as Record<string, unknown>;

        const text = (key: string) =>
          typeof answer[key] === 'string' && String(answer[key]).trim().length > 0;

        if (
          ![1, 2, 3, 4, 5].includes(Number(answer.firstImpression)) ||
          !(Number(answer.age) > 0 && Number(answer.age) <= 120) ||
          !text('style') ||
          !text('motivation') ||
          ![0, 25, 50, 75, 100].includes(Number(answer.retouchStrength)) ||
          answer.retouchStrength === '' ||
          answer.retouchStrength === null ||
          answer.retouchStrength === undefined ||
          !['customer', 'director'].includes(String(answer.selector)) ||
          answer.safetyRead !== true
        )
          throw new DomainError(
            'SURVEY_INCOMPLETE',
            '첫인상·나이·스타일·신청 계기·보정 강도·셀렉 주체·주의사항 확인을 작성해주세요.',
          );
        const budgetNeeded = await first(
          env,
          "SELECT addon_id FROM shoot_addons WHERE shoot_id=? AND addon_id IN ('rental','outfit','shopping') AND quantity>0 LIMIT 1",
          shootId,
        );
        if (budgetNeeded && !(Number(answer.budget) > 0))
          throw new DomainError(
            'BUDGET_REQUIRED',
            '의상 대여·코디 제작·동행 쇼핑을 신청한 경우 의상 준비 예산을 입력해주세요.',
          );
        if (
          !(await first(env, "SELECT id FROM uploads WHERE shoot_id=? AND kind='survey'", shootId))
        )
          throw new DomainError('FACE_PHOTO_REQUIRED', '최근 얼굴 사진을 한 장 이상 올려주세요.');
        if (statusInfo(shoot.status).order < statusInfo('survey_submitted').order)
          to = 'survey_submitted';
      }
      statements.push(
        statement(
          env,
          'INSERT INTO surveys(shoot_id,answers_json,page_done_json,submitted_at,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(shoot_id) DO UPDATE SET answers_json=excluded.answers_json,page_done_json=excluded.page_done_json,submitted_at=COALESCE(excluded.submitted_at,surveys.submitted_at),updated_at=excluded.updated_at',
          shootId,
          JSON.stringify(answers),
          JSON.stringify(pages),
          body.submit === true ? now : null,
          now,
        ),
      );
      reason = body.submit === true ? '고객 설문 제출' : '설문 자동 저장';
      break;
    }
    case 'share_plan': {
      director(actor);
      const concept = requiredText(body, 'concept', 200);
      const outfits = requiredText(body, 'outfits', 4000);
      const note = typeof body.note === 'string' ? body.note.slice(0, 4000) : '';
      statements.push(
        statement(
          env,
          'INSERT INTO shoot_plans(shoot_id,concept,outfits,note,shared_at) VALUES(?,?,?,?,?) ON CONFLICT(shoot_id) DO UPDATE SET concept=excluded.concept,outfits=excluded.outfits,note=excluded.note,shared_at=excluded.shared_at',
          shootId,
          concept,
          outfits,
          note,
          now,
        ),
      );
      if (statusInfo(shoot.status).order < statusInfo('preparing').order) to = 'preparing';
      statements.push(
        notification(env, shootId, 'plan_shared', '촬영 설계가 공유되었습니다. · 외부 발송 없음'),
      );
      statements.push(
        statement(
          env,
          "UPDATE uploads SET visible=1 WHERE shoot_id=? AND kind='plan_ref'",
          shootId,
        ),
      );
      reason = '담당자가 촬영 설계 공유';
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason };
}
