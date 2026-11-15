// D1 조회와 원자적 일괄 저장, 저장 충돌 오류를 공통으로 처리합니다.
import { DomainError } from '@manspick/domain';
import type { Env } from '../runtime/env.ts';

export type SqlValue = string | number | null;

export function statement(env: Env, sql: string, ...values: SqlValue[]) {
  return env.DB.prepare(sql).bind(...values);
}

export async function rows<T>(env: Env, sql: string, ...values: SqlValue[]): Promise<T[]> {
  return (await statement(env, sql, ...values).all<T>()).results;
}

export async function first<T>(env: Env, sql: string, ...values: SqlValue[]): Promise<T | null> {
  return statement(env, sql, ...values).first<T>();
}

export async function batch(env: Env, statements: D1PreparedStatement[]) {
  try {
    return await env.DB.batch(statements);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (/UNIQUE constraint failed: shoots\.access_token_hash/.test(message))
      throw new DomainError(
        'CUSTOMER_LINK_UNAVAILABLE',
        '고객 링크를 만들지 못했습니다. 잠시 후 다시 시도해주세요.',
        503,
      );
    if (/UNIQUE|CHECK|REVISION_LIMIT|PHOTO_SCOPE|FOREIGN KEY/.test(message))
      throw new DomainError(
        'CONFLICT',
        '다른 요청이 먼저 처리됐거나 현재 상태에서 실행할 수 없습니다. 새로고침 후 확인해주세요.',
        409,
      );
    throw error;
  }
}
