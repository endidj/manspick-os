// 데이터베이스 연결을 확인하고 현재 API의 저장소와 로컬 모드를 알려줍니다.
import { first } from '../database/statements.ts';
import { localDemo } from './env.ts';
import type { Env } from './env.ts';

export async function health(request: Request, env: Env) {
  await first(env, 'SELECT 1 AS ok');
  return {
    ok: true,
    storage: 'd1+r2',
    demo: localDemo(request, env),
    externalMessages: false,
  };
}
