// 세션 쿠키를 발급하고 현재 로그인과 폐기를 서버에서 확인합니다.
import { DomainError } from '@manspick/domain';
import type { StaffRole } from '@manspick/domain';
import type { Actor, SessionDTO } from '@manspick/contracts';
import { first, statement } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { hash, randomToken } from './crypto.ts';

const COOKIE = { staff: 'manspick_staff', customer: 'manspick_customer' } as const;
const SESSION_HOURS = { staff: 8, customer: 12 } as const;
const activeStaffSession = `FROM sessions a JOIN staff s ON s.id=a.staff_id
  WHERE a.token_hash=? AND a.kind='staff' AND a.expires_at>? AND s.active=1
  AND s.auth_version=COALESCE(a.token_version,0)`;
type SessionKind = Actor['kind'];

function cookieValue(request: Request, name: string) {
  const entry = (request.headers.get('Cookie') ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry?.slice(name.length + 1) ?? '';
}

function sessionCookie(request: Request, kind: SessionKind, value: string, clear = false) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE[kind]}=${value}; Path=/; HttpOnly; SameSite=Lax${secure}${clear ? '; Max-Age=0' : ''}`;
}

function staffSessionHash(request: Request) {
  const token =
    request.headers.get('X-Manspick-Surface') === 'user' ? '' : cookieValue(request, COOKIE.staff);
  return token ? hash(token) : null;
}

export async function administratorSessionGuard(request: Request, staffId: string) {
  return {
    condition: `EXISTS(SELECT 1 ${activeStaffSession} AND s.id=? AND s.role='admin')`,
    values: [await staffSessionHash(request), new Date().toISOString(), staffId],
  };
}

async function currentActor(request: Request, env: Env): Promise<Actor | null> {
  const surface = request.headers.get('X-Manspick-Surface');
  const now = new Date().toISOString();
  const staffToken = await staffSessionHash(request);
  if (staffToken) {
    const staff = await first<{ id: string; name: string; role: StaffRole }>(
      env,
      `SELECT s.id,s.name,s.role ${activeStaffSession}`,
      staffToken,
      now,
    );
    if (staff) return { kind: 'staff', ...staff };
  }
  const customerToken = surface === 'admin' ? '' : cookieValue(request, COOKIE.customer);
  if (!customerToken) return null;
  const shoot = await first<{ id: string; name: string }>(
    env,
    `SELECT s.id,c.name FROM sessions a JOIN shoots s ON s.id=a.shoot_id
      JOIN customers c ON c.id=s.customer_id
      WHERE a.token_hash=? AND a.kind='customer' AND a.expires_at>? AND a.token_version=s.token_version`,
    await hash(customerToken),
    now,
  );
  return shoot
    ? { kind: 'customer', id: shoot.id, shootId: shoot.id, name: shoot.name, role: 'customer' }
    : null;
}

export async function requireActor(request: Request, env: Env) {
  const actor = await currentActor(request, env);
  if (!actor) throw new DomainError('UNAUTHENTICATED', '로그인이 필요합니다.', 401);
  return actor;
}

export async function createSession(
  request: Request,
  env: Env,
  actor: Actor,
  version: number,
): Promise<{ data: SessionDTO; cookie: string } | null> {
  const { kind } = actor;
  const staff = kind === 'staff';
  const subjectId = staff ? actor.id : (actor.shootId ?? actor.id);
  const subject = staff
    ? 'SELECT 1 FROM staff WHERE id=? AND auth_version=? AND active=1'
    : 'SELECT 1 FROM shoots WHERE id=? AND token_version=?';
  const token = randomToken();
  const now = new Date();
  const result = await statement(
    env,
    `INSERT INTO sessions(token_hash,kind,staff_id,shoot_id,token_version,created_at,expires_at)
      SELECT ?,?,?,?,?,?,? WHERE EXISTS(${subject})`,
    await hash(token),
    kind,
    staff ? subjectId : null,
    staff ? null : subjectId,
    version,
    now.toISOString(),
    new Date(now.getTime() + SESSION_HOURS[kind] * 60 * 60 * 1000).toISOString(),
    subjectId,
    version,
  ).run();
  if (!result.meta.changes) return null;
  return {
    data: { actor, ...(actor.shootId ? { shootId: actor.shootId } : {}) },
    cookie: sessionCookie(request, kind, token),
  };
}

export async function logout(request: Request, env: Env) {
  for (const name of Object.values(COOKIE)) {
    const token = cookieValue(request, name);
    if (token)
      await statement(env, 'DELETE FROM sessions WHERE token_hash=?', await hash(token)).run();
  }
  return [sessionCookie(request, 'staff', '', true), sessionCookie(request, 'customer', '', true)];
}
