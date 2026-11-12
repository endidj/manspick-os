// Nest 애플리케이션을 조립하고 본문 파싱 이전의 출처 검사와 요청 경계를 설정합니다.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { ServerResponse } from 'node:http';
import { AppModule } from '../app.module.ts';
import { requireActor } from '../security/sessions.ts';
import { requestStorage } from './context.ts';
import type { ApiRequest } from './context.ts';
import { ApiExpressAdapter } from './express.adapter.ts';
import { enforceOrigin } from './origin.ts';
import { notFound } from './responses.ts';

export async function createApplication() {
  const adapter = new ApiExpressAdapter();
  // 기존 jsonBody/upload가 인증 이후에 한 번만 읽도록 Express 자동 파싱을 끕니다.
  const app = await NestFactory.create(AppModule, adapter, {
    bodyParser: false,
    logger: false,
    abortOnError: false,
  });
  app.use(
    async (request: ApiRequest, _response: ServerResponse, next: (error?: unknown) => void) => {
      const context = requestStorage.getStore();
      if (!context) return next(new Error('Request bindings are unavailable'));
      request.apiContext = context;
      const url = new URL(context.request.url);
      request.url = (url.pathname.replace(/\/$/, '') || '/') + url.search;
      try {
        enforceOrigin(context.request, context.env);
        // HEAD는 Express가 경로를 디코딩하거나 GET으로 대체하기 전에 처리합니다.
        if (context.request.method === 'HEAD') {
          await requireActor(context.request, context.env);
          notFound();
        }
        next();
      } catch (error) {
        next(error);
      }
    },
  );
  await app.init();
  return app;
}
