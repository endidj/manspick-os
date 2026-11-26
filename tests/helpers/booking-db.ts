// 예약·지표 회귀 테스트에 로컬 시연 환경과 메모리 DB를 제공합니다.
import type { Env } from '../../apps/server/src/runtime/env.ts';
import { LocalD1 } from './local-d1.ts';

export function setup() {
  const d1 = new LocalD1();
  const env: Env = {
    LOCAL_DEMO: 'true',
    DB: d1 as unknown as D1Database,
    BUCKET: {} as R2Bucket,
  };
  return { db: d1.database, env };
}
