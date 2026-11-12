// Cloudflare의 공식 Node HTTP 연결로 요청별 바인딩을 Nest 서버에 전달합니다.
import { handleAsNodeRequest } from 'cloudflare:node';
import { createApplication } from '../http/app.ts';
import { requestStorage } from '../http/context.ts';
import { failure } from '../http/responses.ts';
import { routingRequest } from '../http/routing-request.ts';
import type { Env } from './env.ts';

const port = 3000;
let application: Promise<void> | undefined;

async function initialize() {
  const app = await createApplication();
  await app.listen(port);
}

export async function handleRequest(request: Request, env: Env) {
  try {
    application ??= initialize().catch((error) => {
      application = undefined;
      throw error;
    });
    await application;
    return await requestStorage.run(
      { request, env },
      async () => await handleAsNodeRequest(port, routingRequest(request)),
    );
  } catch (error) {
    return failure(error, request);
  }
}
