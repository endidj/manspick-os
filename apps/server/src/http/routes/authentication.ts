// 고객·직원 로그인과 로컬 시연, 로그아웃 및 로그인 정보 API를 연결합니다.
import { Hono } from 'hono';
import { demoData } from '../../runtime/demo.ts';
import { customerLogin } from '../../security/customer-login.ts';
import { logout } from '../../security/sessions.ts';
import {
  confirmStaffLogin,
  demoLogin,
  requestStaffLogin,
  staffLoginOptions,
} from '../../security/staff-login.ts';
import { issueCustomerLink } from '../../security/customer-link.ts';
import type { ApiEnvironment, AuthenticatedEnvironment } from '../context.ts';
import { jsonBody, requiredText } from '../input.ts';
import { success } from '../responses.ts';

export const authenticationRoutes = new Hono<ApiEnvironment>();

authenticationRoutes.get('/auth/staff/options', (context) =>
  success(staffLoginOptions(context.req.raw, context.env)),
);

authenticationRoutes.post('/auth/staff/request', async (context) => {
  const body = await jsonBody(context.req.raw);
  return success(
    await requestStaffLogin(context.req.raw, context.env, requiredText(body, 'email', 254)),
    202,
  );
});

authenticationRoutes.post('/auth/staff/confirm', async (context) => {
  const body = await jsonBody(context.req.raw);
  const result = await confirmStaffLogin(
    context.req.raw,
    context.env,
    requiredText(body, 'token', 200),
  );
  return success(result.data, 200, [result.cookie]);
});

authenticationRoutes.post('/auth/customer', async (context) => {
  const body = await jsonBody(context.req.raw);
  const result = await customerLogin(
    context.req.raw,
    context.env,
    requiredText(body, 'token', 200),
    requiredText(body, 'last4', 4),
  );
  return success(result.data, 200, [result.cookie]);
});
authenticationRoutes.post('/demo/session', async (context) => {
  const body = await jsonBody(context.req.raw);
  const result = await demoLogin(context.req.raw, context.env, requiredText(body, 'role', 20));
  return success(result.data, 200, [result.cookie]);
});
authenticationRoutes.post('/auth/logout', async (context) =>
  success({ ok: true }, 200, await logout(context.req.raw, context.env)),
);
authenticationRoutes.get('/demo', async (context) =>
  success(await demoData(context.req.raw, context.env)),
);

export const sessionRoutes = new Hono<AuthenticatedEnvironment>();

sessionRoutes.post('/auth/customer-link/:shootId', async (context) =>
  success(
    await issueCustomerLink(
      context.req.raw,
      context.env,
      context.get('actor'),
      context.req.param('shootId'),
    ),
  ),
);

sessionRoutes.get('/session', (context) => {
  const actor = context.get('actor');
  return success({ actor, ...(actor.shootId ? { shootId: actor.shootId } : {}) });
});
