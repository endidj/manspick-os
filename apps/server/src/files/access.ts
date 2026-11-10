// 업로드 파일을 화면용 데이터로 바꾸고 사진별 열람 권한을 확인합니다.
import type { Actor, AssetDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { staffCan } from '../security/permissions.ts';
import { parseJSON } from '../shared/json.ts';
import { accessibleShoot } from '../shoots/access.ts';

export interface UploadRow {
  id: string;
  shoot_id: string;
  kind: string;
  object_key: string;
  name: string;
  content_type: string;
  size: number;
  visible: number;
  created_at: string;
  uploaded_by: string;
  retouch_job_id: string | null;
  retry_fingerprint: string | null;
}

export function assetDTO(upload: UploadRow, hideName = false): AssetDTO {
  return {
    id: upload.id,
    shootId: upload.shoot_id,
    kind: upload.kind,
    name: hideName ? '보정 작업 사진' : upload.name,
    contentType: upload.content_type,
    size: upload.size,
    visible: Boolean(upload.visible),
    url: `/api/uploads/${upload.id}/blob`,
    createdAt: upload.created_at,
  };
}

async function assignedCandidateIds(env: Env, shootId: string, retoucherId: string) {
  const selections = await rows<{ picks_json: string }>(
    env,
    "SELECT picks_json FROM selections WHERE shoot_id=? AND round='base' AND EXISTS(SELECT 1 FROM retouch_jobs WHERE shoot_id=? AND retoucher_id=? AND kind='base')",
    shootId,
    shootId,
    retoucherId,
  );
  const assigned = await rows<{ photo_id: string }>(
    env,
    "SELECT i.photo_id FROM request_items i JOIN retouch_jobs j ON j.request_id=i.request_id WHERE j.shoot_id=? AND j.retoucher_id=? AND j.kind='extra' UNION SELECT m.parent_photo_id AS photo_id FROM request_items i JOIN retouch_jobs j ON j.request_id=i.request_id JOIN photo_metadata m ON m.photo_id=i.photo_id WHERE j.shoot_id=? AND j.retoucher_id=? AND j.kind='revision' AND m.parent_photo_id IS NOT NULL",
    shootId,
    retoucherId,
    shootId,
    retoucherId,
  );
  return new Set([
    ...selections.flatMap((selection) => parseJSON<string[]>(selection.picks_json, [])),
    ...assigned.map((item) => item.photo_id),
  ]);
}

export async function allowedAsset(env: Env, actor: Actor, upload: UploadRow) {
  await accessibleShoot(env, actor, upload.shoot_id);
  return (await visibleAssets(env, actor, upload.shoot_id, [upload])).length > 0;
}

// Callers must first authorize the shoot. Asset rules are identical for listings and downloads.
export async function visibleAssets(env: Env, actor: Actor, shootId: string, assets: UploadRow[]) {
  const uploads = assets.filter((upload) => upload.shoot_id === shootId);
  if (!uploads.length || staffCan(actor, 'direct')) return uploads;
  if (actor.kind === 'customer')
    return uploads.filter(
      (upload) => ['survey', 'outfit', 'review'].includes(upload.kind) || Boolean(upload.visible),
    );
  const [candidates, photos] = await Promise.all([
    assignedCandidateIds(env, shootId, actor.id),
    rows<{ id: string; kind: string; upload_id: string; assigned: number; reference: number }>(
      env,
      `SELECT p.id,p.kind,p.upload_id,
        EXISTS(SELECT 1 FROM retouch_jobs j WHERE j.id=u.retouch_job_id AND j.shoot_id=p.shoot_id AND j.retoucher_id=?1) AS assigned,
        EXISTS(SELECT 1 FROM retouch_jobs j JOIN request_items i ON i.request_id=j.request_id
          WHERE j.shoot_id=p.shoot_id AND j.retoucher_id=?1 AND j.kind='revision' AND i.photo_id=p.id) AS reference
        FROM photos p JOIN uploads u ON u.id=p.upload_id
        WHERE p.shoot_id=?2 AND (?3 IS NULL OR p.upload_id=?3)`,
      actor.id,
      shootId,
      uploads.length === 1 ? uploads[0]!.id : null,
    ),
  ]);
  const byUpload = new Map(photos.map((photo) => [photo.upload_id, photo]));
  return uploads.filter((upload) => {
    const photo = byUpload.get(upload.id);
    if (!photo) return false;
    if (photo.kind === 'candidate') return candidates.has(photo.id);
    return Boolean(
      photo.reference || (upload.retouch_job_id ? photo.assigned : upload.uploaded_by === actor.id),
    );
  });
}
