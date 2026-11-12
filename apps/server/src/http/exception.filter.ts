// 업무 오류와 예상하지 못한 오류를 기존 비공개 JSON 계약으로 변환합니다.
import { Catch } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { ServerResponse } from 'node:http';
import { requireActor } from '../security/sessions.ts';
import type { ApiRequest } from './context.ts';
import { writeResponse } from './express.adapter.ts';
import { failure } from './responses.ts';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  async catch(error: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const incoming = http.getRequest<ApiRequest>();
    const context = incoming.apiContext;
    const response = http.getResponse<ServerResponse>();
    if (response.headersSent) {
      response.destroy();
      return;
    }
    try {
      // Express의 경로 디코딩 오류도 인증을 우회하거나 원본 경로를 노출하지 않습니다.
      if (error instanceof URIError && context && !context.actor) {
        try {
          await requireActor(context.request, context.env);
        } catch (authenticationError) {
          error = authenticationError;
        }
      }
      const request =
        context?.request ?? new Request('https://api.internal/', { method: incoming.method });
      await writeResponse(response, failure(error, request));
    } catch {
      // Nest는 필터 Promise를 기다리지 않으므로 응답 전송 실패를 내부에서 종료합니다.
      response.destroy();
    }
  }
}
