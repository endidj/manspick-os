// 요청 본문의 크기·JSON 형태·필수 문자열과 경로 매개변수를 검사합니다.
import { DomainError } from '@manspick/domain';
import type { HonoRequest } from 'hono/request';

function tooLarge() {
  return new DomainError('BODY_TOO_LARGE', '요청 내용이 너무 큽니다.', 413);
}

export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  const limit = 128 * 1024;
  const length = Number(request.headers.get('Content-Length') ?? 0);
  if (length > limit) throw tooLarge();
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('body');
    let text = '';
    let total = 0;
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        total += chunk.value.byteLength;
        if (total > limit) {
          void reader.cancel().catch(() => {});
          throw tooLarge();
        }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('shape');
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError('INVALID_JSON', '올바른 요청 본문이 필요합니다.');
  }
}

export function requiredText(body: Record<string, unknown>, key: string, max = 1000) {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new DomainError('INVALID_INPUT', `${key} 항목을 확인해주세요.`);
  return value.trim();
}

export function pathParam(request: HonoRequest, name: string) {
  // Hono가 잘못된 인코딩을 무시하지 않도록 먼저 검증하고, 디코딩은 param에 한 번만 맡깁니다.
  decodeURI(request.path);
  return request.param(name)!;
}
