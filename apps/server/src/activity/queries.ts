// 운영 권한을 확인한 뒤 최근 알림 대기 기록을 조회합니다.
import type { Actor } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { operator } from '../security/permissions.ts';

export async function listNotifications(env: Env, actor: Actor) {
  operator(actor);
  return {
    items: await rows(
      env,
      'SELECT id,shoot_id AS shootId,kind,body,state,send_at AS sendAt FROM notifications ORDER BY created_at DESC LIMIT 100',
    ),
    externalMessages: false,
  };
}
