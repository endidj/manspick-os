// HTTP 요청에 연결된 Cloudflare 저장소와 로그인 정보를 타입으로 구분합니다.
import type { Actor } from '@manspick/contracts';
import type { Env } from '../runtime/env.ts';

export type ApiEnvironment = { Bindings: Env };

export type AuthenticatedEnvironment = ApiEnvironment & { Variables: { actor: Actor } };
