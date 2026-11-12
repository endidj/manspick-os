// 비공개 테스트 Worker의 관리자 표면 제한과 시연 계정 정책을 적용합니다.
import type { Env } from './env.ts';

export function adminTestWorker(handler: (request: Request, env: Env) => Promise<Response>) {
  return {
    async fetch(request: Request, env: Env) {
      if (request.headers.get('X-Manspick-Surface') !== 'admin')
        return new Response(null, { status: 404 });
      return handler(request, { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: true });
    },
  };
}
