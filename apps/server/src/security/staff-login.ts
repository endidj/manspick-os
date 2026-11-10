// 사전에 등록된 활성 직원에게 이메일 로그인 링크를 보내고 한 번만 사용하게 합니다.
import { DomainError, isStaffRole } from '@manspick/domain';
import type { StaffRole } from '@manspick/domain';
import { first, statement } from '../database/statements.ts';
import { appOrigin, isAdminTestRequest, localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { logError } from '../runtime/log.ts';
import { hash, randomToken } from './crypto.ts';
import { createSession } from './sessions.ts';

const TTL = 15 * 60_000;
type Staff = { id: string; name: string; role: StaffRole; version: number };

export function staffEmailDomain(env: Env) {
  return env.STAFF_EMAIL_DOMAIN?.trim().toLowerCase() || undefined;
}

export function staffEmail(address: string, domain?: string) {
  const email = address.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+$/.test(email) || (domain && email.split('@')[1] !== domain)) return null;
  return email;
}

function emailConfig(env: Env) {
  const origin = appOrigin(env.STAFF_APP_ORIGIN);
  const from = env.STAFF_EMAIL_FROM?.trim();
  const domain = staffEmailDomain(env);
  if (!origin || !env.EMAIL || !from || !domain) return null;
  return { origin, email: env.EMAIL, from, domain };
}

export function staffLoginOptions(request: Request, env: Env) {
  const config = emailConfig(env);
  return {
    demo: localDemo(request, env) || isAdminTestRequest(request, env),
    email: Boolean(config && config.origin === new URL(request.url).origin),
  };
}

async function attempt(env: Env, key: string, limit: number, now: Date) {
  const result = await first<{ count: number }>(
    env,
    `INSERT INTO rate_limits(key,count,resets_at) VALUES(?,1,?)
     ON CONFLICT(key) DO UPDATE SET
       count=CASE WHEN resets_at<=? THEN 1 ELSE count+1 END,
       resets_at=CASE WHEN resets_at<=? THEN excluded.resets_at ELSE resets_at END
     RETURNING count`,
    `staff:${key}`,
    new Date(now.getTime() + TTL).toISOString(),
    now.toISOString(),
    now.toISOString(),
  );
  return Boolean(result && result.count <= limit);
}

export async function requestStaffLogin(request: Request, env: Env, address: string) {
  const config = emailConfig(env);
  if (!config || config.origin !== new URL(request.url).origin)
    throw new DomainError(
      'STAFF_LOGIN_UNAVAILABLE',
      '이 주소에서 직원 이메일 로그인을 사용할 수 없습니다.',
      503,
    );
  const now = new Date();
  const email = staffEmail(address, config.domain);
  const ipKey = await hash(request.headers.get('CF-Connecting-IP') ?? 'unknown');
  if (!(await attempt(env, `ip:${ipKey}`, 20, now)))
    throw new DomainError('RATE_LIMITED', '잠시 후 다시 시도해주세요.', 429);
  const accepted = { accepted: true };
  if (!email) return accepted;
  if (!(await attempt(env, `email:${await hash(email)}`, 3, now))) return accepted;
  // Fetch two to fail closed if old data has two differently cased copies of the address.
  const matches = await statement(
    env,
    'SELECT id,auth_version AS version FROM staff WHERE email=? COLLATE NOCASE AND active=1 LIMIT 2',
    email,
  ).all<Pick<Staff, 'id' | 'version'>>();
  const staff = matches.results.length === 1 ? matches.results[0] : undefined;
  if (!staff) return accepted;
  const token = randomToken();
  const tokenHash = await hash(token);
  const [, issued] = await env.DB.batch([
    statement(env, 'DELETE FROM staff_login_tokens WHERE expires_at<=?', now.toISOString()),
    statement(
      env,
      `INSERT INTO staff_login_tokens(token_hash,staff_id,expires_at,auth_version)
        SELECT ?,id,?,auth_version FROM staff WHERE id=? AND active=1 AND auth_version=?`,
      tokenHash,
      new Date(now.getTime() + TTL).toISOString(),
      staff.id,
      staff.version,
    ),
  ]);
  if (!issued?.meta.changes) return accepted;
  const link = new URL('/', config.origin);
  link.hash = `staffToken=${token}`;
  try {
    await config.email.send({
      to: email,
      from: config.from,
      subject: '직원 로그인 링크',
      text: `아래 링크를 열고 로그인을 계속하세요. 15분 동안 한 번 사용할 수 있습니다.\n\n${link.href}\n\n요청하지 않았다면 이 메일을 무시해주세요.`,
    });
  } catch {
    logError(request, 'staff_login_email_send_failed');
    await statement(env, 'DELETE FROM staff_login_tokens WHERE token_hash=?', tokenHash).run();
  }
  return accepted;
}

function invalid() {
  return new DomainError(
    'STAFF_LINK_INVALID',
    '사용할 수 없는 링크입니다. 새 링크를 요청해주세요.',
    401,
  );
}

export async function confirmStaffLogin(request: Request, env: Env, token: string) {
  if (
    appOrigin(env.STAFF_APP_ORIGIN) !== new URL(request.url).origin ||
    !/^[a-f0-9]{64}$/.test(token)
  )
    throw invalid();
  const record = await first<{ staff_id: string; auth_version: number }>(
    env,
    'DELETE FROM staff_login_tokens WHERE token_hash=? AND expires_at>? RETURNING staff_id,auth_version',
    await hash(token),
    new Date().toISOString(),
  );
  if (!record) throw invalid();
  const staff = await first<Staff>(
    env,
    'SELECT id,name,role,auth_version AS version FROM staff WHERE id=? AND active=1 AND auth_version=?',
    record.staff_id,
    record.auth_version,
  );
  if (!staff) throw invalid();
  const session = await staffSession(request, env, staff);
  if (!session) throw invalid();
  return session;
}

function staffSession(request: Request, env: Env, { id, name, role, version }: Staff) {
  return createSession(request, env, { kind: 'staff', id, name, role }, version);
}

export async function demoLogin(request: Request, env: Env, role: string) {
  const adminTest = isAdminTestRequest(request, env);
  if (!adminTest && !localDemo(request, env))
    throw new DomainError('NOT_FOUND', '찾을 수 없습니다.', 404);
  if (!isStaffRole(role)) throw new DomainError('INVALID_ROLE', '허용되지 않은 역할입니다.');
  const staff = await first<Staff>(
    env,
    `SELECT id,name,role,auth_version AS version FROM staff WHERE active=1 AND role=?${adminTest ? ' AND id=?' : ''} ORDER BY id LIMIT 1`,
    role,
    ...(adminTest ? [`demo-${role}`] : []),
  );
  const session = staff && (await staffSession(request, env, staff));
  if (!session) throw new DomainError('FORBIDDEN', '등록된 활성 직원이 없습니다.', 403);
  return session;
}
