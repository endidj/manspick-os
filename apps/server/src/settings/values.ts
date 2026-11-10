// 운영 설정의 저장값과 화면에 표시할 안전한 주소·문자열을 검사합니다.
import { DomainError } from '@manspick/domain';
import { first } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { parseJSON } from '../shared/json.ts';

export async function settingValue<T>(env: Env, key: string, fallback: T): Promise<T> {
  const value = await first<{ value_json: string }>(
    env,
    'SELECT value_json FROM settings WHERE key=?',
    key,
  );
  return parseJSON<T>(value?.value_json, fallback);
}

export function optionalText(value: unknown, max = 4000): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max)
    throw new DomainError('INVALID_INPUT', '입력 길이와 형식을 확인해주세요.');
  return value.trim();
}

export function safeUrl(value: unknown): string | null {
  const text = optionalText(value, 2000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('url');
    return url.href;
  } catch {
    throw new DomainError('INVALID_URL', '로그인 정보가 없는 HTTPS 주소를 입력해주세요.');
  }
}

export function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new DomainError('INVALID_INPUT', '입력 항목을 확인해주세요.');
  return value as Record<string, unknown>;
}

export function integerValue(value: unknown, max = 100000000) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > max)
    throw new DomainError('INVALID_INPUT', '0 이상의 올바른 숫자를 입력해주세요.');
  return value;
}
