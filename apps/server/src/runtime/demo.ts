// 로컬 시연 환경에서만 가상 고객과 직원 역할 목록을 보여줍니다.
import { DomainError } from '@manspick/domain';
import { first, rows } from '../database/statements.ts';
import { localDemo } from './env.ts';
import type { Env } from './env.ts';

const DEMO_CUSTOMERS = [
  { shootId: 'demo-payment', token: 'demo-payment-access', last4: '1001' },
  { shootId: 'demo-preparation', token: 'demo-preparation-access', last4: '1002' },
  { shootId: 'demo-selection', token: 'demo-selection-access', last4: '1003' },
  { shootId: 'demo-result', token: 'demo-result-access', last4: '1004' },
] as const;

export async function demoData(request: Request, env: Env) {
  if (!localDemo(request, env)) throw new DomainError('NOT_FOUND', '찾을 수 없습니다.', 404);
  const staffRoles = await rows<{ role: string; name: string }>(
    env,
    'SELECT role,name FROM staff WHERE active=1 ORDER BY id',
  );
  const customers = [];
  for (const item of DEMO_CUSTOMERS) {
    const shoot = await first<{ name: string; status: string }>(
      env,
      'SELECT c.name,s.status FROM shoots s JOIN customers c ON c.id=s.customer_id WHERE s.id=?',
      item.shootId,
    );
    if (shoot) customers.push({ ...item, ...shoot });
  }
  return {
    staffRoles,
    customers,
    notice:
      '명백한 로컬 가상 데이터입니다. 실제 고객·이메일·알림톡·결제·배포는 연결되지 않았습니다.',
  };
}
