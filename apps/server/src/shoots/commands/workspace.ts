// 준비 안내 확인과 현장 체크·셀렉 주체 확정·공유 링크를 권한 검사 후 저장합니다.
import { DomainError, statusInfo } from '@manspick/domain';
import type { PreparationDTO } from '@manspick/contracts';
import { first, rows, statement } from '../../database/statements.ts';
import { requiredText } from '../../http/input.ts';
import { id } from '../../security/crypto.ts';
import { customer, director } from '../../security/permissions.ts';
import { objectValue, optionalText, safeUrl } from '../../settings/values.ts';
import { parseJSON } from '../../shared/json.ts';
import type { WorkspaceRow } from '../workspace.ts';
import type { CommandContext, PreparedCommand } from './types.ts';

const FIELD_KEYS = [
  'arrival',
  'addons',
  'icebreaking',
  'sequence',
  'outfits',
  'shooting',
  'midcheck',
  'closing',
];

export function validatePreparation(value: unknown): Omit<PreparationDTO, 'confirmedAt'> {
  const data = objectValue(value);
  const place = objectValue(data.location);
  const hair = data.hair ? objectValue(data.hair) : null;
  if (!Array.isArray(data.guides) || data.guides.length < 1 || data.guides.length > 20)
    throw new DomainError('INVALID_INPUT', '준비 안내를 1~20개 입력해주세요.');
  const guides = data.guides.map((entry) => {
    const guide = objectValue(entry);
    const url = safeUrl(guide.url);
    return {
      id: requiredText(guide, 'id', 80),
      title: requiredText(guide, 'title', 100),
      summary: optionalText(guide.summary, 500),
      body: requiredText(guide, 'body', 8000),
      ...(url ? { url } : {}),
      readAt: null,
    };
  });
  if (new Set(guides.map((guide) => guide.id)).size !== guides.length)
    throw new DomainError('INVALID_INPUT', '안내 ID가 중복되었습니다.');
  return {
    location: {
      area: requiredText(place, 'area', 100),
      meetingPlace: requiredText(place, 'meetingPlace', 300),
      mapUrl: safeUrl(place.mapUrl),
      parkingNote: optionalText(place.parkingNote),
      parkingUrl: safeUrl(place.parkingUrl),
    },
    hair: hair
      ? {
          place: requiredText(hair, 'place', 300),
          time: optionalText(hair.time, 100),
          mapUrl: safeUrl(hair.mapUrl),
          note: optionalText(hair.note),
        }
      : null,
    guides,
  };
}

export async function prepareWorkspace(
  type: string,
  context: CommandContext,
): Promise<PreparedCommand> {
  const { env, actor, shoot, shootId, body, now } = context;
  const statements: D1PreparedStatement[] = [];
  let to = shoot.status;
  let reason = '';
  switch (type) {
    case 'save_preparation': {
      director(actor);
      const preparation = validatePreparation(body.preparation);
      statements.push(
        statement(
          env,
          'INSERT INTO shoot_workspace(shoot_id,preparation_json) VALUES(?,?) ON CONFLICT(shoot_id) DO UPDATE SET preparation_json=excluded.preparation_json,preparation_confirmed_at=NULL',
          shootId,
          JSON.stringify(preparation),
        ),
      );
      statements.push(statement(env, 'DELETE FROM guide_checks WHERE shoot_id=?', shootId));
      reason = '촬영 준비 안내 공유 · 변경 안내는 다시 확인 필요';
      break;
    }
    case 'mark_preparation_read':
    case 'confirm_preparation': {
      customer(actor);
      const workspace = await first<WorkspaceRow>(
        env,
        'SELECT * FROM shoot_workspace WHERE shoot_id=?',
        shootId,
      );
      const preparation = parseJSON<PreparationDTO | null>(workspace?.preparation_json, null);
      if (!preparation)
        throw new DomainError(
          'PREPARATION_NOT_SHARED',
          '담당자가 준비 안내를 공유한 뒤 확인할 수 있습니다.',
          409,
        );
      if (type === 'mark_preparation_read') {
        const guideId = requiredText(body, 'guideId', 80);
        if (!preparation.guides.some((guide) => guide.id === guideId))
          throw new DomainError('INVALID_GUIDE', '공유된 안내를 확인해주세요.');
        statements.push(
          statement(
            env,
            'INSERT INTO guide_checks(shoot_id,guide_key,checked_at) VALUES(?,?,?) ON CONFLICT(shoot_id,guide_key) DO UPDATE SET checked_at=excluded.checked_at',
            shootId,
            guideId,
            now,
          ),
        );
        reason = '고객 준비 안내 열람';
      } else {
        const read = await rows<{ guide_key: string }>(
          env,
          'SELECT guide_key FROM guide_checks WHERE shoot_id=?',
          shootId,
        );
        if (preparation.guides.some((guide) => !read.some((check) => check.guide_key === guide.id)))
          throw new DomainError('GUIDES_UNREAD', '공유된 준비 안내를 모두 읽어주세요.', 409);
        statements.push(
          statement(
            env,
            'UPDATE shoot_workspace SET preparation_confirmed_at=? WHERE shoot_id=?',
            now,
            shootId,
          ),
        );
        reason = '고객 준비 안내 전체 확인';
      }
      break;
    }
    case 'save_field_checklist': {
      director(actor);
      if (
        statusInfo(shoot.status).stage < 4 ||
        statusInfo(shoot.status).order > statusInfo('shoot_complete').order
      )
        throw new DomainError(
          'FIELD_CLOSED',
          '촬영 준비·당일 단계에서 현장 내용을 저장해주세요.',
          409,
        );
      const checks = body.checks;
      if (
        !Array.isArray(checks) ||
        checks.some((key) => !FIELD_KEYS.includes(String(key))) ||
        new Set(checks).size !== checks.length
      )
        throw new DomainError('INVALID_INPUT', '현장 확인 항목을 확인해주세요.');
      if (!['customer', 'director'].includes(String(body.selector)))
        throw new DomainError('INVALID_INPUT', '최종 셀렉 주체를 선택해주세요.');
      const previous = await first<WorkspaceRow>(
        env,
        'SELECT * FROM shoot_workspace WHERE shoot_id=?',
        shootId,
      );
      const survey = await first<{ answers_json: string }>(
        env,
        'SELECT answers_json FROM surveys WHERE shoot_id=?',
        shootId,
      );
      const requested = previous?.selection_confirmed_at
        ? shoot.select_by
        : (parseJSON<Record<string, unknown>>(survey?.answers_json, {}).selector ?? 'customer');
      const changeReason =
        body.selector !== requested
          ? requiredText(body, 'reason', 1000)
          : optionalText(body.reason, 1000);
      statements.push(
        statement(
          env,
          'INSERT INTO shoot_sessions(shoot_id,steps_json) VALUES(?,?) ON CONFLICT(shoot_id) DO UPDATE SET steps_json=excluded.steps_json',
          shootId,
          JSON.stringify(checks),
        ),
      );
      statements.push(
        statement(
          env,
          'INSERT INTO shoot_workspace(shoot_id,selection_confirmed_at,selection_reason,field_memo) VALUES(?,?,?,?) ON CONFLICT(shoot_id) DO UPDATE SET selection_confirmed_at=excluded.selection_confirmed_at,selection_reason=excluded.selection_reason,field_memo=excluded.field_memo',
          shootId,
          now,
          changeReason,
          optionalText(body.note),
        ),
      );
      statements.push(
        statement(env, 'UPDATE shoots SET select_by=? WHERE id=?', String(body.selector), shootId),
      );
      reason = `현장 체크 저장 · ${body.selector === 'director' ? '디렉터' : '고객'} 셀렉 확정${changeReason ? ` · ${changeReason}` : ''}`;
      break;
    }
    case 'complete_field': {
      director(actor);
      if (statusInfo(shoot.status).stage !== 5)
        throw new DomainError('FIELD_CLOSED', '촬영 당일 단계에서 완료해주세요.', 409);
      const session = await first<{ steps_json: string }>(
        env,
        'SELECT steps_json FROM shoot_sessions WHERE shoot_id=?',
        shootId,
      );
      const workspace = await first<WorkspaceRow>(
        env,
        'SELECT * FROM shoot_workspace WHERE shoot_id=?',
        shootId,
      );
      const checks = parseJSON<string[]>(session?.steps_json, []);
      if (FIELD_KEYS.some((key) => !checks.includes(key)) || !workspace?.selection_confirmed_at)
        throw new DomainError(
          'FIELD_INCOMPLETE',
          '8개 현장 확인과 셀렉 주체 확정을 마쳐주세요.',
          409,
        );
      statements.push(
        statement(env, 'UPDATE shoot_sessions SET done_at=? WHERE shoot_id=?', now, shootId),
      );
      to = 'shoot_complete';
      reason = '현장 8항목 확인 후 촬영 완료';
      break;
    }
    case 'save_file_link': {
      director(actor);
      if (!['retouched', 'original'].includes(String(body.kind)))
        throw new DomainError('INVALID_INPUT', '파일 종류를 확인해주세요.');
      const url = safeUrl(requiredText(body, 'url', 2000));
      const label = requiredText(body, 'label', 100);
      if (typeof body.visible !== 'boolean')
        throw new DomainError('INVALID_INPUT', '공개 여부를 확인해주세요.');
      statements.push(
        statement(
          env,
          'INSERT INTO external_file_links(id,shoot_id,kind,label,url,visible,published_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(shoot_id,kind) DO UPDATE SET label=excluded.label,url=excluded.url,visible=excluded.visible,published_at=excluded.published_at',
          id(),
          shootId,
          String(body.kind),
          label,
          url,
          Number(body.visible),
          body.visible ? now : null,
        ),
      );
      reason = '결과 파일 링크 저장 · 원본은 후기 승인 뒤 고객에게 공개';
      break;
    }
    default:
      throw new DomainError('UNKNOWN_ACTION', '지원하지 않는 동작입니다.');
  }
  return { statements, to, reason };
}
