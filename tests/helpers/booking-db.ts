// 예약·지표 회귀 테스트는 메모리 SQLite로 실제 마이그레이션과 D1 배치를 확인합니다.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { Env } from '../../apps/server/src/runtime/env.ts';

export function setup() {
  const db = new DatabaseSync(':memory:');
  const migrations = new URL('../../infra/migrations/', import.meta.url);
  for (const file of readdirSync(migrations)
    .filter((file) => file.endsWith('.sql'))
    .sort())
    db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  db.exec(readFileSync(new URL('../../infra/seed.sql', import.meta.url), 'utf8'));
  const env = {
    LOCAL_DEMO: 'true',
    DB: {
      prepare(sql: string) {
        return {
          bind(...args: SQLInputValue[]) {
            const query = db.prepare(sql);
            return {
              first: () => query.get(...args) ?? null,
              all: () => ({ results: query.all(...args) }),
              run: () => ({ meta: query.run(...args) }),
            };
          },
        };
      },
      batch(statements: { run(): unknown }[]) {
        db.exec('BEGIN IMMEDIATE');
        try {
          const result = statements.map((s) => s.run());
          db.exec('COMMIT');
          return result;
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    },
  } as unknown as Env;
  return { db, env };
}
