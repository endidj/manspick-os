// 경로 실행 전에 요청 출처·로그인·직원 역할을 공통으로 검사합니다.
import { createMiddleware } from 'hono/factory';
import { administrator, operator } from '../security/permissions.ts';
import { requireActor } from '../security/sessions.ts';
import type { ApiEnvironment, AuthenticatedEnvironment } from './context.ts';
import { enforceOrigin } from './origin.ts';
import { notFound } from './responses.ts';

export const checkRequest = createMiddleware<ApiEnvironment>(async (context, next) => {
  enforceOrigin(context.req.raw, context.env);
  // Hono의 HEAD→GET 자동 연결로 공개 조회가 열리지 않도록 기존 인증 후 404 계약을 유지합니다.
  if (context.req.raw.method === 'HEAD') {
    await requireActor(context.req.raw, context.env);
    notFound();
  }
  await next();
});

export const authenticate = createMiddleware<AuthenticatedEnvironment>(async (context, next) => {
  context.set('actor', await requireActor(context.req.raw, context.env));
  await next();
});

export const requireOperator = createMiddleware<AuthenticatedEnvironment>(async (context, next) => {
  operator(context.get('actor'));
  await next();
});

export const requireAdministrator = createMiddleware<AuthenticatedEnvironment>(
  async (context, next) => {
    administrator(context.get('actor'));
    await next();
  },
);
