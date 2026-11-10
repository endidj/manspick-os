// 공통 보안 검사와 기능별 Hono 라우터를 조립해 Worker 요청을 처리합니다.
import { Hono } from 'hono';
import type { Env } from '../runtime/env.ts';
import type { ApiEnvironment } from './context.ts';
import { authenticate, checkRequest } from './middleware.ts';
import { failure, notFound } from './responses.ts';
import { authenticationRoutes, sessionRoutes } from './routes/authentication.ts';
import { bookingRoutes } from './routes/booking.ts';
import { operationRoutes } from './routes/operations.ts';
import { shootRoutes } from './routes/shoots.ts';
import { staffRoutes } from './routes/staff.ts';
import { systemRoutes } from './routes/system.ts';
import { uploadRoutes } from './routes/uploads.ts';

const app = new Hono<ApiEnvironment>({
  // 원본 경로를 유지하고 끝의 슬래시 한 개만 허용해 기존 매칭·디코딩 계약을 보존합니다.
  getPath: (request) => new URL(request.url).pathname.replace(/\/$/, '') || '/',
});

app.onError((error, context) => failure(error, context.req.raw));
app.notFound(notFound);
app.use('*', checkRequest);
app.route('/api', systemRoutes);
app.route('/api', bookingRoutes);
app.route('/api', authenticationRoutes);

// 공개 경로가 응답한 뒤에만 로그인 검사를 배치하며 미등록 경로도 인증 후 404로 처리합니다.
app.use('*', authenticate);
app.route('/api', sessionRoutes);
app.route('/api', shootRoutes);
app.route('/api', uploadRoutes);
app.route('/api', operationRoutes);
app.route('/api', staffRoutes);

export async function handleRequest(request: Request, env: Env): Promise<Response> {
  try {
    return await app.fetch(request, env);
  } catch (error) {
    // Hono의 경로 매칭 이전 오류와 Error가 아닌 예외도 기존 비공개 오류 응답으로 바꿉니다.
    return failure(error, request);
  }
}
