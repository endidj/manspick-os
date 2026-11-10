// 고객의 촬영 링크와 전화번호 확인, 로그인 시도 제한을 처리합니다.
import { DomainError } from '@manspick/domain';
import { first, statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { hash } from './crypto.ts';
import { createSession } from './sessions.ts';

export async function customerLogin(request: Request, env: Env, token: string, last4: string) {
  const tokenHash = await hash(token);
  const now = new Date();
  const ipHash = await hash(request.headers.get('CF-Connecting-IP') ?? 'local');
  const key = `auth:${ipHash}`;
  await statement(
    env,
    'INSERT INTO rate_limits(key,count,resets_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN resets_at<? THEN 1 ELSE count+1 END,resets_at=CASE WHEN resets_at<? THEN excluded.resets_at ELSE resets_at END',
    key,
    new Date(now.getTime() + 600000).toISOString(),
    now.toISOString(),
    now.toISOString(),
  ).run();
  const rate = await first<{ count: number }>(
    env,
    'SELECT count FROM rate_limits WHERE key=?',
    key,
  );
  if (rate && rate.count > 30)
    throw new DomainError('RATE_LIMITED', '잠시 후 다시 시도해주세요.', 429);
  const attempts = await first<{ failures: number; locked_until: string | null }>(
    env,
    'SELECT failures,locked_until FROM access_attempts WHERE token_hash=?',
    tokenHash,
  );
  if (attempts?.locked_until && attempts.locked_until > now.toISOString())
    throw new DomainError('LOCKED', '확인 시도가 많아 10분 동안 잠겼습니다.', 429);
  const shoot = await first<{ id: string; name: string; phone: string; token_version: number }>(
    env,
    'SELECT s.id,c.name,c.phone,s.token_version FROM shoots s JOIN customers c ON c.id=s.customer_id WHERE s.access_token_hash=?',
    tokenHash,
  );
  if (!shoot || !/^\d{4}$/.test(last4) || shoot.phone.slice(-4) !== last4) {
    await statement(
      env,
      `INSERT INTO access_attempts(token_hash,failures,locked_until,updated_at) VALUES(?,1,NULL,?)
      ON CONFLICT(token_hash) DO UPDATE SET
      failures=CASE WHEN locked_until IS NOT NULL AND locked_until<=excluded.updated_at THEN 1 ELSE failures+1 END,
      locked_until=CASE WHEN locked_until IS NOT NULL AND locked_until<=excluded.updated_at THEN NULL WHEN failures+1>=5 THEN ? ELSE locked_until END,
      updated_at=excluded.updated_at`,
      tokenHash,
      now.toISOString(),
      new Date(now.getTime() + 600000).toISOString(),
    ).run();
    throw new DomainError('AUTH_FAILED', '링크와 전화번호 뒤 4자리를 확인해주세요.', 401);
  }
  await statement(env, 'DELETE FROM access_attempts WHERE token_hash=?', tokenHash).run();
  const session = await createSession(
    request,
    env,
    { kind: 'customer', id: shoot.id, shootId: shoot.id, role: 'customer', name: shoot.name },
    shoot.token_version,
  );
  if (!session)
    throw new DomainError('AUTH_FAILED', '링크와 전화번호 뒤 4자리를 확인해주세요.', 401);
  return session;
}
