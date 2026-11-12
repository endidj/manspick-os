// 공개 테스트용 랜딩·고객 앱만 전용 저장소에 연결하고 시연 권한 상승을 차단합니다.
import type { Env } from './env.ts';

export function publicTestWorker(handler: (request: Request, env: Env) => Promise<Response>) {
  return {
    async fetch(request: Request, env: Env) {
      if (!['landing', 'user'].includes(request.headers.get('X-Manspick-Surface') ?? ''))
        return new Response(null, { status: 404 });
      return handler(request, { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: false });
    },
  };
}
