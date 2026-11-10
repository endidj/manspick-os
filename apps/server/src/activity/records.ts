// 촬영 변경 이력과 발송 대기 알림을 저장할 SQL을 만듭니다.
import type { Actor } from '@manspick/contracts';
import { statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';

export function timelineStatement(
  env: Env,
  shootId: string,
  actor: Actor,
  from: string | null,
  to: string | null,
  reason: string,
) {
  return statement(
    env,
    'INSERT INTO timeline(id,shoot_id,from_status,to_status,actor_id,actor_name,reason) VALUES(?,?,?,?,?,?,?)',
    id(),
    shootId,
    from,
    to,
    actor.id,
    actor.name,
    reason,
  );
}

export function notification(env: Env, shootId: string, kind: string, body: string) {
  return statement(
    env,
    'INSERT INTO notifications(id,shoot_id,kind,body,send_at) VALUES(?,?,?,?,?)',
    id(),
    shootId,
    kind,
    body,
    new Date().toISOString(),
  );
}
