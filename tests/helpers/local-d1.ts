// 실제 마이그레이션과 시드로 메모리 SQLite를 만들고 D1 요청과 원자적 배치를 실행합니다.
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

export class LocalStatement {
  database: DatabaseSync;
  sql: string;
  values: SQLInputValue[];

  constructor(database: DatabaseSync, sql: string, values: SQLInputValue[] = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values: SQLInputValue[]) {
    return new LocalStatement(this.database, this.sql, values);
  }

  async first(column?: string) {
    const row = this.database.prepare(this.sql).get(...this.values);
    return column ? (row?.[column] ?? null) : (row ?? null);
  }

  execute() {
    const results = this.database.prepare(this.sql).all(...this.values);
    return {
      success: true,
      results,
      meta: { changes: this.database.prepare('SELECT changes() AS n').get()?.n ?? 0 },
    };
  }

  async all() {
    return this.execute();
  }

  async run() {
    return this.execute();
  }
}

export class LocalD1 {
  database = new DatabaseSync(':memory:');
  beforeBatch?: () => Promise<void>;

  constructor() {
    const migrations = new URL('../../infra/migrations/', import.meta.url);
    for (const file of readdirSync(migrations)
      .filter((name) => name.endsWith('.sql'))
      .sort())
      this.database.exec(readFileSync(new URL(file, migrations), 'utf8'));
    this.database.exec(readFileSync(new URL('../../infra/seed.sql', import.meta.url), 'utf8'));
  }

  prepare(sql: string) {
    return new LocalStatement(this.database, sql);
  }

  async batch(statements: LocalStatement[]) {
    if (this.beforeBatch) await this.beforeBatch();
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const result = statements.map((statement) => statement.execute());
      this.database.exec('COMMIT');
      return result;
    } catch (cause) {
      this.database.exec('ROLLBACK');
      throw cause;
    }
  }
}
