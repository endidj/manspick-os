// 성공·오류·미등록 경로의 JSON 응답과 비공개 캐시 정책을 통일합니다.
import { DomainError } from '@manspick/domain';
import { logError } from '../runtime/log.ts';

export function success(data: unknown, status = 200, cookies: string[] = []) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(JSON.stringify({ data }), { status, headers });
}

export function failure(error: unknown, request: Request) {
  const known = error instanceof DomainError;
  const status = known ? error.status : 500;
  const code = known ? error.code : 'INTERNAL_ERROR';
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  if (status >= 500)
    headers.set('X-Request-Id', logError(request, 'api_failure', { status, code }));
  return new Response(
    JSON.stringify({
      error: {
        code,
        message: known ? error.message : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      },
    }),
    { status, headers },
  );
}

export function notFound(): never {
  throw new DomainError('NOT_FOUND', '요청한 경로를 찾을 수 없습니다.', 404);
}
