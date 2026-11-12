// 실제 Nest Express 라우터에 HTTP 요청을 주입해 D1/R2 회귀 검사를 소켓 없이 실행합니다.
import { inject } from 'light-my-request';
import type { InjectOptions } from 'light-my-request';
import { createApplication } from '../../apps/server/src/http/app.ts';
import { requestStorage } from '../../apps/server/src/http/context.ts';
import { routingRequest } from '../../apps/server/src/http/routing-request.ts';
import { adminTestWorker } from '../../apps/server/src/runtime/admin-test.ts';
import type { Env } from '../../apps/server/src/runtime/env.ts';

const application = createApplication();

export async function handleRequest(request: Request, env: Env) {
  const app = await application;
  const route = routingRequest(request);
  const result = await requestStorage.run(
    { request, env },
    async () =>
      await inject(app.getHttpAdapter().getInstance(), {
        method: request.method as InjectOptions['method'],
        url: request.url,
        headers: Object.fromEntries(route.headers),
      }),
  );
  const headers = new Headers();
  for (const [name, value] of Object.entries(result.headers)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, String(item));
  }
  return new Response(request.method === 'HEAD' ? null : new Uint8Array(result.rawPayload), {
    status: result.statusCode,
    headers,
  });
}

export const testWorker = adminTestWorker(handleRequest);
