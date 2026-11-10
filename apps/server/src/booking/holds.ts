// 만료된 미입금 예약의 일정, 결제, 알림과 이력을 원자적으로 정리합니다.
import { DomainError } from '@manspick/domain';
import { mutate } from '../database/mutations.ts';
import { rows, statement } from '../database/statements.ts';
import type { SqlValue } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { id } from '../security/crypto.ts';

export const HOLD_RELEASE_REASON = '예약 hold 만료 · 자원 및 알림 해제';

export const expiredHold = `EXISTS(SELECT 1 FROM payments p WHERE p.shoot_id=s.id
  AND p.kind='base' AND p.state='pending' AND p.held_until<=?)`;

export const reclaimableHold = `(s.status='payment_pending' AND ${expiredHold})`;

export const rebookableShoot = `(s.status='calendar_pending' AND s.starts_at IS NULL
  AND s.ends_at IS NULL AND s.director_id IS NULL
  AND EXISTS(SELECT 1 FROM payments p WHERE p.shoot_id=s.id AND p.kind='base' AND p.state='released')
  AND NOT EXISTS(SELECT 1 FROM payments p WHERE p.shoot_id=s.id AND p.kind='base' AND p.state!='released'))`;

export function releaseHoldStatements(env: Env, shootId: string) {
  return [
    statement(env, 'DELETE FROM slots WHERE shoot_id=?', shootId),
    statement(
      env,
      'UPDATE shoots SET director_id=NULL,starts_at=NULL,ends_at=NULL WHERE id=?',
      shootId,
    ),
    statement(
      env,
      "UPDATE payments SET state='released',held_until=NULL WHERE shoot_id=? AND state='pending'",
      shootId,
    ),
    statement(
      env,
      "UPDATE notifications SET state='cancelled' WHERE shoot_id=? AND state='local_pending'",
      shootId,
    ),
  ];
}

export async function releaseExpiredHolds(
  env: Env,
  now: string,
  filter: { sql: string; values: SqlValue[] },
) {
  const expired = await rows<{ id: string; version: number }>(
    env,
    `SELECT s.id,s.version FROM shoots s WHERE (${filter.sql}) AND ${reclaimableHold}`,
    ...filter.values,
    now,
  );
  for (const shoot of expired) {
    try {
      await mutate(
        env,
        shoot,
        [
          ...releaseHoldStatements(env, shoot.id),
          statement(env, "UPDATE shoots SET status='calendar_pending' WHERE id=?", shoot.id),
          statement(
            env,
            "INSERT INTO timeline(id,shoot_id,from_status,to_status,actor_id,actor_name,reason) VALUES(?,?,'payment_pending','calendar_pending','system','시스템',?)",
            id(),
            shoot.id,
            HOLD_RELEASE_REASON,
          ),
        ],
        {
          sql: `EXISTS(SELECT 1 FROM shoots s WHERE s.id=? AND ${reclaimableHold})`,
          values: [shoot.id, now],
        },
      );
    } catch (error) {
      if (!(error instanceof DomainError && error.status === 409)) throw error;
    }
  }
}
