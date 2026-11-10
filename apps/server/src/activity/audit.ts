// 관리 변경과 함께 저장할 감사 이벤트를 작성합니다.
import type { Actor } from '@manspick/contracts';
import { statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';

type AuditEvent = {
  action: string;
  targetType: string;
  targetId: string;
  previous?: unknown;
  next?: unknown;
};

export function auditStatement(env: Env, actor: Pick<Actor, 'id' | 'name'>, event: AuditEvent) {
  return statement(
    env,
    'INSERT INTO audit_events(id,actor_id,actor_name,action,target_type,target_id,previous_json,next_json) VALUES(?,?,?,?,?,?,?,?)',
    id(),
    actor.id,
    actor.name,
    event.action,
    event.targetType,
    event.targetId,
    JSON.stringify(event.previous ?? null),
    JSON.stringify(event.next ?? null),
  );
}
