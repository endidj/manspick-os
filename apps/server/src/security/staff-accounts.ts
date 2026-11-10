// 관리자만 직원 계정을 관리하고 권한 변경과 함께 로그인 자격을 회수합니다.
import type { Actor, StaffAccountDTO } from '@manspick/contracts';
import { DomainError, isStaffRole } from '@manspick/domain';
import { auditStatement } from '../activity/audit.ts';
import { batch, first, rows, statement } from '../database/statements.ts';
import { isAdminTestRequest, localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';
import { id } from './crypto.ts';
import { administrator } from './permissions.ts';
import { administratorSessionGuard } from './sessions.ts';
import { staffEmail, staffEmailDomain } from './staff-login.ts';

const columns = 'id,name,email,role,active,auth_version AS version';
type AccountRow = Omit<StaffAccountDTO, 'active'> & { active: number };

function accountDTO(row: AccountRow): StaffAccountDTO {
  return { ...row, active: Boolean(row.active) };
}

export async function listStaffAccounts(env: Env, actor: Actor) {
  administrator(actor);
  return (await rows<AccountRow>(env, `SELECT ${columns} FROM staff ORDER BY name,id`)).map(
    accountDTO,
  );
}

export async function registerStaffAccount(
  request: Request,
  env: Env,
  actor: Actor,
  input: { name: string; email: string; role: unknown },
) {
  administrator(actor);
  const domain = staffEmailDomain(env);
  if (!domain && !localDemo(request, env) && !isAdminTestRequest(request, env))
    throw new DomainError(
      'STAFF_DOMAIN_REQUIRED',
      '직원 이메일 허용 도메인을 먼저 설정해주세요.',
      503,
    );
  const email = staffEmail(input.email, domain);
  if (!email) throw new DomainError('INVALID_INPUT', '허용된 회사 이메일을 입력해주세요.');
  if (!isStaffRole(input.role)) throw new DomainError('INVALID_ROLE', '허용되지 않은 역할입니다.');
  const account = {
    id: `staff-${id()}`,
    name: input.name,
    email,
    role: input.role,
    active: true,
    version: 0,
  };
  return saveAccount(request, env, actor, account, null, 'create');
}

export async function changeStaffAccount(
  request: Request,
  env: Env,
  actor: Actor,
  staffId: string,
  change:
    | { action: 'update'; version: unknown; role: unknown; active: unknown }
    | { action: 'revoke_sessions'; version: unknown },
) {
  administrator(actor);
  if (
    typeof change.version !== 'number' ||
    !Number.isSafeInteger(change.version) ||
    change.version < 0
  )
    throw new DomainError('INVALID_INPUT', '계정 버전을 확인해주세요.');
  const row = await first<AccountRow>(env, `SELECT ${columns} FROM staff WHERE id=?`, staffId);
  if (!row) throw new DomainError('NOT_FOUND', '직원 계정을 찾을 수 없습니다.', 404);
  const previous = accountDTO(row);
  if (previous.version !== change.version)
    throw new DomainError(
      'CONFLICT',
      '다른 요청이 먼저 변경했습니다. 계정 목록을 새로고침해주세요.',
      409,
    );
  const next = { ...previous, version: previous.version + 1 };
  if (change.action === 'update') {
    if (!isStaffRole(change.role) || typeof change.active !== 'boolean')
      throw new DomainError('INVALID_INPUT', '역할과 활성 상태를 확인해주세요.');
    if (previous.role === change.role && previous.active === change.active) return previous;
    // 자기 권한은 다른 관리자가 변경해야 하므로 활성 관리자가 한 명 이상 남습니다.
    if (actor.id === staffId)
      throw new DomainError(
        'SELF_ACCOUNT_CHANGE',
        '내 역할과 활성 상태는 다른 관리자가 변경해야 합니다.',
        409,
      );
    next.role = change.role;
    next.active = change.active;
  }
  return saveAccount(request, env, actor, next, previous, change.action);
}

async function saveAccount(
  request: Request,
  env: Env,
  actor: Actor,
  next: StaffAccountDTO,
  previous: StaffAccountDTO | null,
  action: 'create' | 'update' | 'revoke_sessions',
) {
  const guard = id();
  const administrator = await administratorSessionGuard(request, actor.id);
  const condition = previous
    ? 'EXISTS(SELECT 1 FROM staff WHERE id=? AND auth_version=?)'
    : 'NOT EXISTS(SELECT 1 FROM staff WHERE email=? COLLATE NOCASE)';
  await batch(env, [
    statement(
      env,
      `INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN
        ${administrator.condition} AND ${condition} THEN 1 ELSE 0 END`,
      guard,
      ...administrator.values,
      ...(previous ? [previous.id, previous.version] : [next.email]),
    ),
    ...(previous
      ? [
          statement(
            env,
            'UPDATE staff SET role=?,active=?,auth_version=? WHERE id=?',
            next.role,
            Number(next.active),
            next.version,
            next.id,
          ),
          statement(env, "DELETE FROM sessions WHERE kind='staff' AND staff_id=?", next.id),
          statement(env, 'DELETE FROM staff_login_tokens WHERE staff_id=?', next.id),
        ]
      : [
          statement(
            env,
            'INSERT INTO staff(id,name,email,role) VALUES(?,?,?,?)',
            next.id,
            next.name,
            next.email,
            next.role,
          ),
        ]),
    auditStatement(env, actor, {
      action,
      targetType: 'staff',
      targetId: next.id,
      previous: previous && { role: previous.role, active: previous.active },
      next: { role: next.role, active: next.active },
    }),
    statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard),
  ]);
  return next;
}
