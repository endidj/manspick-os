// 관리자 테스트 앱의 Service Binding 요청을 전용 D1과 R2에 연결합니다.
import { handleRequest } from '../apps/server/src/http/app.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';

const worker = {
  async fetch(request: Request, env: Env) {
    if (request.headers.get('X-Manspick-Surface') !== 'admin') {
      return new Response(null, { status: 404 });
    }

    return handleRequest(request, { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: true });
  },
};

export default worker;
