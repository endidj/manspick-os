// 운영자가 후기 요청과 혜택 내역을 고객별로 확인할 수 있게 조회합니다.
import type { Actor, OperationsSettingsDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { operator } from '../security/permissions.ts';

export async function followups(env: Env, actor: Actor) {
  operator(actor);
  const requests = await rows<{
    shootId: string;
    customerName: string;
    id: string;
    type: string;
    state: string;
    message: string | null;
    createdAt: string;
  }>(
    env,
    "SELECT s.id AS shootId,c.name AS customerName,r.id,r.type,r.state,r.message,r.created_at AS createdAt FROM requests r JOIN shoots s ON s.id=r.shoot_id JOIN customers c ON c.id=s.customer_id WHERE r.type='review' ORDER BY r.created_at DESC LIMIT 200",
  );
  const items = requests.map(({ shootId, customerName, ...request }) => ({
    shootId,
    customerName,
    request,
  }));
  return {
    campaigns: await rows<OperationsSettingsDTO['campaigns'][number]>(
      env,
      'SELECT id,name,amount,active FROM campaigns ORDER BY id',
    ),
    items,
  };
}
