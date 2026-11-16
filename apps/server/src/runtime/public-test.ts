// 세 테스트 앱을 같은 저장소에 연결하고 관리자 테스트 로그인은 관리자 앱에 한정합니다.
import type { Env } from './env.ts';

export function publicTestWorker(handler: (request: Request, env: Env) => Promise<Response>) {
  return {
    async fetch(request: Request, env: Env) {
      const surface = request.headers.get('X-Manspick-Surface') ?? '';
      if (!['landing', 'user', 'admin'].includes(surface))
        return new Response(null, { status: 404 });
      return handler(request, {
        ...env,
        LOCAL_DEMO: 'false',
        ADMIN_TEST: surface === 'admin',
        CUSTOMER_TEST: surface === 'user',
      });
    },
  };
}
