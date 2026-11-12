// 원본 Fetch 요청과 Cloudflare 바인딩을 요청별로 분리해 Nest 컨트롤러에 전달합니다.
import { AsyncLocalStorage } from 'node:async_hooks';
import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { IncomingMessage } from 'node:http';
import type { Actor } from '@manspick/contracts';
import type { Env } from '../runtime/env.ts';

export interface RequestContext {
  request: Request;
  env: Env;
  // 보호된 컨트롤러에 진입하기 전에 AccessGuard가 검증한 actor를 설정합니다.
  actor: Actor;
}

export type IncomingContext = Omit<RequestContext, 'actor'> & { actor?: Actor };
export type ApiRequest = IncomingMessage & { apiContext: IncomingContext };
export const requestStorage = new AsyncLocalStorage<IncomingContext>();

export const ApiContext = createParamDecorator((_data: unknown, host: ExecutionContext) => {
  return host.switchToHttp().getRequest<ApiRequest>().apiContext;
});
