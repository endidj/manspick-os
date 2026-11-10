// 촬영의 버전과 추가 조건을 확인한 뒤 변경 내용을 한 번에 저장합니다.
import { id } from '../security/crypto.ts';
import type { Env } from '../runtime/env.ts';
import { batch, statement } from './statements.ts';
import type { SqlValue } from './statements.ts';

export async function mutate(
  env: Env,
  shoot: { id: string; version: number },
  statements: D1PreparedStatement[],
  condition?: { sql: string; values: SqlValue[] },
) {
  const guard = id();
  return batch(env, [
    statement(
      env,
      `INSERT INTO mutation_guards(id,ok) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM shoots WHERE id=? AND version=?)${condition ? ` AND (${condition.sql})` : ''} THEN 1 ELSE 0 END`,
      guard,
      shoot.id,
      shoot.version,
      ...(condition?.values ?? []),
    ),
    ...statements,
    statement(env, 'UPDATE shoots SET version=version+1 WHERE id=?', shoot.id),
    statement(env, 'DELETE FROM mutation_guards WHERE id=?', guard),
  ]);
}
