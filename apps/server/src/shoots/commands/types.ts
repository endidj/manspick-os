// 촬영 명령이 확인할 정보와 한 번에 저장할 변경 내용을 정의합니다.
import type { ShootStatus } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';
import type { SqlValue } from '../../database/statements.ts';
import type { Env } from '../../runtime/env.ts';
import type { ShootRow } from '../access.ts';

export interface CommandContext {
  env: Env;
  actor: Actor;
  shoot: ShootRow;
  shootId: string;
  body: Record<string, unknown>;
  now: string;
}

export interface PreparedCommand {
  statements: D1PreparedStatement[];
  to: ShootStatus;
  reason: string;
  condition?: { sql: string; values: SqlValue[] };
}
