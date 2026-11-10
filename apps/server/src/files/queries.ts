// 볼 수 있는 촬영의 파일만 조회하고 보정가에게는 파일 이름을 가려서 전달합니다.
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
    items: (await visibleAssets(env, actor, shootId, uploads)).map((item) =>
      assetDTO(item, actor.role === 'retoucher'),
    ),
  };
}
