// 상태를 바꾸는 요청이 허용된 웹 주소에서 왔는지 확인합니다.
import { DomainError } from '@manspick/domain';
import { localDemo } from '../runtime/env.ts';
import type { Env } from '../runtime/env.ts';

export function enforceOrigin(request: Request, env: Env) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('Origin');
  if (!origin && localDemo(request, env)) return;
  const own = new URL(request.url).origin;
  if (origin === own) return;
  if (
    localDemo(request, env) &&
    origin &&
    /^http:\/\/(localhost|127\.0\.0\.1):(3000|3001|3002)$/.test(origin)
  )
    return;
  throw new DomainError('ORIGIN_DENIED', '허용되지 않은 요청 출처입니다.', 403);
}
