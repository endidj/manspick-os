// 직원 계정 조회, 등록, 역할 변경과 세션 회수 API를 관리자에게만 연결합니다.
import { Hono } from 'hono';
import {
  changeStaffAccount,
  listStaffAccounts,
  registerStaffAccount,
} from '../../security/staff-accounts.ts';
import type { AuthenticatedEnvironment } from '../context.ts';
import { jsonBody, pathParam, requiredText } from '../input.ts';
import { requireAdministrator } from '../middleware.ts';
import { success } from '../responses.ts';

export const staffRoutes = new Hono<AuthenticatedEnvironment>();

staffRoutes.get('/staff', requireAdministrator, async (context) =>
  success(await listStaffAccounts(context.env, context.get('actor'))),
);

staffRoutes.post('/staff', requireAdministrator, async (context) => {
  const body = await jsonBody(context.req.raw);
  return success(
    await registerStaffAccount(context.req.raw, context.env, context.get('actor'), {
      name: requiredText(body, 'name', 100),
      email: requiredText(body, 'email', 254),
      role: body.role,
    }),
    201,
  );
});

staffRoutes.post('/staff/:id', requireAdministrator, async (context) => {
  const body = await jsonBody(context.req.raw);
  return success(
    await changeStaffAccount(
      context.req.raw,
      context.env,
      context.get('actor'),
      pathParam(context.req, 'id'),
      { action: 'update', version: body.version, role: body.role, active: body.active },
    ),
  );
});

staffRoutes.post('/staff/:id/revoke-sessions', requireAdministrator, async (context) => {
  const body = await jsonBody(context.req.raw);
  return success(
    await changeStaffAccount(
      context.req.raw,
      context.env,
      context.get('actor'),
      pathParam(context.req, 'id'),
      { action: 'revoke_sessions', version: body.version },
    ),
  );
});
