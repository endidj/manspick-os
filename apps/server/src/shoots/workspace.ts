// 촬영 준비·현장 진행·공유 링크를 모으고 고객과 보정가에게 필요한 정보만 보여줍니다.
import type { Actor, CustomerProfileDTO, FileLinkDTO, PreparationDTO } from '@manspick/contracts';
import { first, rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { settingValue } from '../settings/values.ts';
import { parseJSON } from '../shared/json.ts';
import type { ShootRow } from './access.ts';

export interface WorkspaceRow {
  preparation_json: string | null;
  preparation_confirmed_at: string | null;
  selection_confirmed_at: string | null;
  selection_reason: string;
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
  const hidden = actor.role === 'retoucher';
  const preparation = parseJSON<PreparationDTO | null>(workspace?.preparation_json, null);
  const reviewApproved = await first(
    env,
    "SELECT id FROM requests WHERE shoot_id=? AND type='review' AND state='complete'",
    shoot.id,
  );
  const links = hidden
    ? []
    : await rows<FileLinkDTO & { visible: number }>(
        env,
        'SELECT id,kind,label,url,published_at AS publishedAt,visible FROM external_file_links WHERE shoot_id=?',
        shoot.id,
      );
  return {
    directorId: hidden ? null : shoot.director_id,
    retoucherId: shoot.retoucher_id,
    preparation:
      hidden || !preparation
        ? null
        : {
            ...preparation,
            guides: preparation.guides.map((guide) => ({
              ...guide,
              readAt: checks.find((check) => check.guide_key === guide.id)?.checked_at ?? null,
            })),
            confirmedAt: workspace?.preparation_confirmed_at ?? null,
          },
    selectionMode: workspace?.selection_confirmed_at ? shoot.select_by : null,
    selectorReason: hidden || actor.kind === 'customer' ? '' : (workspace?.selection_reason ?? ''),
    fieldMemo: hidden || actor.kind === 'customer' ? '' : (workspace?.field_memo ?? ''),
    fieldChecklist:
      hidden || actor.kind === 'customer'
        ? { checks: [], completedAt: null }
        : {
            checks: parseJSON<string[]>(session?.steps_json, []),
            completedAt: session?.done_at ?? null,
          },
    fileLinks: links
      .filter(
        (link) =>
          actor.kind !== 'customer' ||
          (link.visible && (link.kind !== 'original' || reviewApproved)),
      )
      .map(({ id, kind, label, url, publishedAt }) => ({ id, kind, label, url, publishedAt })),
    paymentInstructions: hidden ? null : paymentInstructions,
    profile: hidden ? null : parseJSON<CustomerProfileDTO | null>(workspace?.profile_json, null),
  };
}
