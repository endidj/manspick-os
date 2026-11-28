// 촬영 준비와 현장 진행 정보를 역할에 맞게 조회합니다.
import type { Actor, CustomerProfileDTO, PreparationDTO } from '@manspick/contracts';
import { first, rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { settingValue } from '../settings/values.ts';
import { parseJSON } from '../shared/json.ts';
import type { ShootRow } from './access.ts';

export interface WorkspaceRow {
  preparation_json: string | null;
  preparation_confirmed_at: string | null;
  field_memo: string;
  profile_json: string | null;
}

export async function workspaceDetail(env: Env, actor: Actor, shoot: ShootRow) {
  const [workspace, session, checks, paymentInstructions] = await Promise.all([
    first<WorkspaceRow>(env, 'SELECT * FROM shoot_workspace WHERE shoot_id=?', shoot.id),
    first<{ steps_json: string; done_at: string | null }>(
      env,
      'SELECT steps_json,done_at FROM shoot_sessions WHERE shoot_id=?',
      shoot.id,
    ),
    rows<{ guide_key: string; checked_at: string }>(
      env,
      'SELECT guide_key,checked_at FROM guide_checks WHERE shoot_id=?',
      shoot.id,
    ),
    settingValue<{ bankName: string; accountNumber: string; accountHolder: string } | null>(
      env,
      'payment_instructions',
      null,
    ),
  ]);
  const preparation = parseJSON<PreparationDTO | null>(workspace?.preparation_json, null);
  return {
    directorId: shoot.director_id,
    preparation: !preparation
      ? null
      : {
          ...preparation,
          guides: preparation.guides.map((guide) => ({
            ...guide,
            readAt: checks.find((check) => check.guide_key === guide.id)?.checked_at ?? null,
          })),
          confirmedAt: workspace?.preparation_confirmed_at ?? null,
        },
    fieldMemo: actor.kind === 'customer' ? '' : (workspace?.field_memo ?? ''),
    fieldChecklist:
      actor.kind === 'customer'
        ? { checks: [], completedAt: null }
        : {
            checks: parseJSON<string[]>(session?.steps_json, []),
            completedAt: session?.done_at ?? null,
          },
    paymentInstructions,
    profile: parseJSON<CustomerProfileDTO | null>(workspace?.profile_json, null),
  };
}
