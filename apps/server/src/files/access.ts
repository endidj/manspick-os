// 업로드 파일을 화면용 데이터로 바꾸고 사진별 열람 권한을 확인합니다.
import type { Actor, AssetDTO } from '@manspick/contracts';
import type { Env } from '../runtime/env.ts';
import { staffCan } from '../security/permissions.ts';
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
  uploaded_by_name?: string;
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
    ...(upload.kind === 'internal_photo' && upload.uploaded_by_name
      ? { uploadedByName: upload.uploaded_by_name }
      : {}),
  };
}

export async function allowedAsset(env: Env, actor: Actor, upload: UploadRow) {
  await accessibleShoot(env, actor, upload.shoot_id);
  return (await visibleAssets(env, actor, upload.shoot_id, [upload])).length > 0;
}

// Callers must first authorize the shoot. Asset rules are identical for listings and downloads.
export async function visibleAssets(_env: Env, actor: Actor, shootId: string, assets: UploadRow[]) {
  const uploads = assets.filter((upload) => upload.shoot_id === shootId);
  if (staffCan(actor, 'direct')) return uploads;
  if (actor.kind === 'customer')
    return uploads.filter(
      (u) =>
        u.kind === 'survey' || u.kind === 'outfit' || (u.kind === 'plan_ref' && Boolean(u.visible)),
    );
  return [];
}
