// 직원의 배정과 고객 본인 여부에 맞춰 조회 가능한 촬영을 찾습니다.
import { DomainError } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import { first } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { operationAllowed } from '../security/permissions.ts';

export interface ShootRow {
  id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  status: ShootStatus;
  package_id: string;
  package_snapshot: string;
  addons_json: string;
  total_amount: number;
  director_id: string | null;
  retoucher_id: string | null;
  director_name: string | null;
  retoucher_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
  survey_due_at: string | null;
  outfit_due_at: string | null;
  version: number;
  token_version: number;
  payment_state: string;
  pending_requests: number;
  select_by: 'customer' | 'director';
  pending_notifications: number;
  retouch_due_at: string | null;
  created_at: string;
}

export const SHOOT_SELECT = `SELECT s.*,c.name AS customer_name,c.phone,d.name AS director_name,r.name AS retoucher_name,
COALESCE((SELECT state FROM payments WHERE shoot_id=s.id AND kind='base' LIMIT 1),'pending') AS payment_state,
(SELECT COUNT(*) FROM requests WHERE shoot_id=s.id AND state IN ('new','processing')) AS pending_requests,
(SELECT COUNT(*) FROM notifications WHERE shoot_id=s.id AND state='local_pending') AS pending_notifications,
(SELECT MIN(due_at) FROM retouch_jobs WHERE shoot_id=s.id AND state!='complete') AS retouch_due_at,
(SELECT json_group_array(json_object('id',addon_id,'name',name)) FROM
  (SELECT addon_id,name FROM shoot_addons WHERE shoot_id=s.id ORDER BY addon_id)) AS addons_json
FROM shoots s JOIN customers c ON c.id=s.customer_id LEFT JOIN staff d ON d.id=s.director_id LEFT JOIN staff r ON r.id=s.retoucher_id`;

export function scope(actor: Actor) {
  if (actor.kind === 'customer') return { sql: 's.id=?', values: [actor.shootId ?? actor.id] };
  if (operationAllowed(actor)) return { sql: '1=1', values: [] };
  if (actor.role === 'director') return { sql: 's.director_id=?', values: [actor.id] };
  return {
    sql: 'EXISTS(SELECT 1 FROM retouch_jobs j WHERE j.shoot_id=s.id AND j.retoucher_id=?)',
    values: [actor.id],
  };
}

export async function accessibleShoot(env: Env, actor: Actor, shootId: string) {
  const access = scope(actor);
  const shoot = await first<ShootRow>(
    env,
    `${SHOOT_SELECT} WHERE s.id=? AND ${access.sql}`,
    shootId,
    ...access.values,
  );
  if (!shoot) throw new DomainError('NOT_FOUND', '촬영을 찾을 수 없습니다.', 404);
  return shoot;
}
