// 권한이 있는 촬영의 파일만 조회합니다.
import type { Actor } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { accessibleShoot } from '../shoots/access.ts';
import { assetDTO, visibleAssets } from './access.ts';
import type { UploadRow } from './access.ts';

export async function listUploads(env: Env, actor: Actor, shootId: string) {
  await accessibleShoot(env, actor, shootId);
  const uploads = await rows<UploadRow>(
    env,
    'SELECT * FROM uploads WHERE shoot_id=? ORDER BY created_at DESC',
    shootId,
  );
  return {
    items: visibleAssets(actor, shootId, uploads).map(assetDTO),
  };
}
