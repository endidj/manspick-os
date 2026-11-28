// 보드 옵션이 실제 주문 스냅샷과 권한 범위를 따르고 기존 검색 조건과 함께 동작하는지 확인합니다.
import assert from 'node:assert/strict';
import { LocalD1, LocalStatement } from './helpers/local-d1.ts';
import test from 'node:test';
import { SHOOT_SELECT } from '../apps/server/src/shoots/access.ts';
import { listBoardShoots, listShoots } from '../apps/server/src/shoots/queries.ts';
import { hash } from '../apps/server/src/security/crypto.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';
import { handleRequest } from './helpers/server.ts';
import {
  defaultBoardFilters,
  restoreBoardFilters,
} from '../apps/frontend-admin-page/src/features/board/board-filters.ts';

test('legacy saved filters retain existing values and default the new addon condition to all', () => {
  const legacy = restoreBoardFilters(
    JSON.stringify({ search: '김', scope: 'today', pending: true }),
  );
  assert.equal(legacy.search, '김');
  assert.equal(legacy.scope, 'today');
  assert.equal(legacy.pending, true);
  assert.equal(legacy.addonId, '');
  assert.equal(legacy.packageId, 'all');
  assert.equal(
    restoreBoardFilters(JSON.stringify({ director: '데모 디렉터' })).director,
    '디렉터1',
  );
  assert.equal(restoreBoardFilters(JSON.stringify({ addonId: 'all' })).addonId, 'all');
  for (const saved of [null, '{', 'null', '[]', '42', '{"addonId":true,"requests":"yes"}'])
    assert.deepEqual(restoreBoardFilters(saved), defaultBoardFilters);
});

function setup() {
  const d1 = new LocalD1();
  const env = { DB: d1 as unknown as D1Database, BUCKET: {} as R2Bucket } satisfies Env;
  return { database: d1.database, env };
}

test('shoot summaries and recent timeline entries use booking-specific indexes', (context) => {
  const { database } = setup();
  context.after(() => database.close());
  const summary = `${SHOOT_SELECT} WHERE s.id=?`;
  const recentEvents =
    'SELECT id FROM timeline WHERE shoot_id=? ORDER BY created_at DESC LIMIT 100';
  const shootId = 'demo-payment';
  const shoot = database.prepare(summary).get(shootId);
  assert.equal(shoot?.payment_state, 'pending');
  assert.equal(shoot?.pending_notifications, 1);
  assert.equal(database.prepare(summary).get('demo-preparation')?.payment_state, 'confirmed');
  assert.deepEqual(
    database
      .prepare(recentEvents)
      .all(shootId)
      .map((event) => event.id),
    ['demo-timeline-demo-payment'],
  );

  function queryPlan(query: string) {
    return database
      .prepare(`EXPLAIN QUERY PLAN ${query}`)
      .all(shootId)
      .map((row) => row.detail)
      .join('\n');
  }

  const summaryPlan = queryPlan(summary);
  assert.match(summaryPlan, /SEARCH payments .*payments_shoot_kind/);
  assert.match(summaryPlan, /SEARCH notifications .*notifications_pending_shoot/);
  const eventsPlan = queryPlan(recentEvents);
  assert.match(eventsPlan, /SEARCH booking_events .*booking_events_booking_created/);
  assert.doesNotMatch(eventsPlan, /TEMP B-TREE/);
});

test('operator board paginates all shootings with independent counts and search facets', async () => {
  const { database, env } = setup();
  try {
    database.exec(`
      WITH RECURSIVE sequence(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM sequence WHERE n<205)
      INSERT INTO shoots(id,customer_id,access_token_hash,status,package_id,package_snapshot,total_amount,starts_at,created_at)
      SELECT printf('old-%03d',n),customer_id,'test-old-hash-'||n,'follow_up',package_id,package_snapshot,total_amount,'2025-01-01T00:00:00Z','2025-01-01 00:00:00'
      FROM sequence CROSS JOIN shoots WHERE id='demo-preparation';
      UPDATE shoots SET starts_at='2026-11-05T15:00:00Z' WHERE id='demo-preparation';
      UPDATE shoots SET starts_at='2026-11-05T14:59:59Z' WHERE id='demo-payment';
      UPDATE shoots SET starts_at='2026-11-12T15:00:00Z' WHERE id IN ('demo-selection','demo-result');
      INSERT OR REPLACE INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price)
      VALUES ('demo-preparation','hair','예약 당시 헤어',1,70000);
      INSERT INTO requests(id,shoot_id,type,state) VALUES ('board-test-request','demo-preparation','deposit','new');
      INSERT INTO notifications(id,shoot_id,kind,body,send_at)
      VALUES ('board-test-message','demo-preparation','test','test','2026-11-05T15:00:00Z');
    `);
    const operator = { kind: 'staff', role: 'admin', id: 'demo-admin', name: '대표' } as const;
    const now = new Date('2026-11-06T00:00:00Z');
    const result = await listBoardShoots(env, operator, new URLSearchParams('page=1'), now);
    assert.ok(result.shoots.some((item) => item.id === 'demo-preparation'));
    assert.equal(result.counts.total, 205 + 4);
    assert.ok(result.shoots.length < result.counts.total);
    assert.equal(result.counts.today, 1);
    assert.equal(result.counts.depositRequests, 1);
    assert.equal(result.matchesByStage[5], 205);
    const last = await listBoardShoots(env, operator, new URLSearchParams('page=9999'), now);
    assert.equal(last.page, Math.ceil(result.counts.total / result.pageSize));
    assert.ok(last.shoots.length > 0);
    assert.ok(!last.shoots.some((item) => result.shoots.some((first) => first.id === item.id)));
    const filtered = await listBoardShoots(
      env,
      operator,
      new URLSearchParams({
        scope: 'today',
        requests: 'true',
        pending: 'true',
        addonId: 'hair',
        search: '촬영 준비중 010-****-1002',
        packageId: 'hybrid',
        director: '디렉터1',
      }),
      now,
    );
    assert.deepEqual(
      filtered.shoots.map((item) => item.id),
      ['demo-preparation'],
    );
    assert.equal(filtered.totalMatches, 1);
    assert.deepEqual(filtered.matchesByStage, [0, 0, 1, 0, 0, 0]);
    assert.deepEqual(filtered.counts, result.counts);
    assert.deepEqual(filtered.facets, result.facets);
    assert.ok(
      result.facets.addons.some((item) => item.id === 'hair' && item.name === '예약 당시 헤어'),
    );
    const find = async (query: string) =>
      (await listBoardShoots(env, operator, new URLSearchParams(query), now)).shoots.map(
        (item) => item.id,
      );
    assert.deepEqual(await find('scope=week'), ['demo-preparation']);
    assert.deepEqual(await find('scope=deposit'), ['demo-preparation']);
    assert.deepEqual(await find('scope=payment&search=1001'), ['demo-payment']);
    assert.deepEqual(await find('search=01000001002'), []);
    const first = await listShoots(env, operator);
    assert.equal(first.shoots.length, 200);
    assert.ok(first.shoots.some((item) => item.id === 'demo-preparation'));
    assert.ok(first.nextCursor);
    const second = await listShoots(env, operator, false, { cursor: first.nextCursor });
    assert.equal(second.shoots.length, 9);
    assert.equal(second.nextCursor, undefined);
    assert.equal(new Set([...first.shoots, ...second.shoots].map(({ id }) => id)).size, 209);
  } finally {
    database.close();
  }
});

test('board reports profile completion from each booking survey submission', async (context) => {
  const { database, env } = setup();
  context.after(() => database.close());
  database.exec(`
    DELETE FROM booking_surveys WHERE booking_id='demo-selection';
    UPDATE booking_surveys SET submitted_at=NULL WHERE booking_id='demo-preparation';
  `);
  const actor = { kind: 'staff', role: 'admin', id: 'demo-admin', name: '대표' } as const;
  const { shoots } = await listBoardShoots(env, actor, new URLSearchParams());
  const profile = (id: string) => shoots.find((shoot) => shoot.id === id)?.profileSubmitted;
  assert.equal(profile('demo-selection'), false);
  assert.equal(profile('demo-preparation'), false);
  assert.equal(profile('demo-result'), true);
});

test('kanban stages follow payment, confirmed Seoul schedule, shoot, delivery and review milestones', async (context) => {
  const { database, env } = setup();
  context.after(() => database.close());
  const operator = { kind: 'staff', role: 'admin', id: 'demo-admin', name: '대표' } as const;
  const now = new Date('2026-11-05T15:00:00Z');
  const board = () => listBoardShoots(env, operator, new URLSearchParams('kanban=true'), now);
  const stageOf = async (id: string) => (await board()).shoots.find((s) => s.id === id)?.boardStage;
  const updateStatus = database.prepare("UPDATE shoots SET status=? WHERE id='demo-result'");

  database.exec(`
    UPDATE shoots SET starts_at='2026-11-07T02:00:00Z' WHERE id='demo-preparation';
    INSERT INTO booking_time_options(id,booking_id,starts_at)
    VALUES('board-option','demo-preparation','2026-11-05T16:00:00Z');
  `);
  assert.equal(await stageOf('demo-payment'), undefined);
  assert.equal(await stageOf('demo-preparation'), 1);
  assert.equal(await stageOf('demo-selection'), 4);
  assert.equal(await stageOf('demo-result'), 5);

  database.exec(`
    INSERT INTO booking_confirmations(booking_id,option_id,confirmed_by_staff_id,location,confirmed_at,occupancy_starts_at,occupancy_ends_at)
    VALUES('demo-preparation','board-option','demo-director','스튜디오','2026-11-01T00:00:00Z','2026-11-05T16:00:00Z','2026-11-05T18:00:00Z');
  `);
  assert.equal(await stageOf('demo-preparation'), 3);
  assert.equal(
    (
      await listBoardShoots(
        env,
        operator,
        new URLSearchParams('kanban=true'),
        new Date('2026-11-05T14:59:59Z'),
      )
    ).shoots.find((s) => s.id === 'demo-preparation')?.boardStage,
    2,
  );
  for (const [status, stage] of [
    ['shooting', 3],
    ['shoot_complete', 4],
    ['delivered', 5],
    ['review_requested', 5],
    ['review_pending', 5],
    ['review_confirmed', 6],
    ['originals_pending', 6],
    ['follow_up', 6],
  ] as const) {
    updateStatus.run(status);
    assert.equal(await stageOf('demo-result'), stage, status);
  }
  updateStatus.run('cancelled');
  const result = await listBoardShoots(
    env,
    operator,
    new URLSearchParams('kanban=true&includeCancelled=true'),
    now,
  );
  assert.deepEqual(result.matchesByStage, [0, 0, 1, 1, 0, 0]);
  assert.equal(result.totalMatches, 2);
  const list = await listBoardShoots(
    env,
    operator,
    new URLSearchParams('includeCancelled=true'),
    now,
  );
  assert.equal(list.totalMatches, 4);
  assert.equal(list.shoots.find((s) => s.id === 'demo-result')?.boardStage, null);
});

test('HTTP board requires an operator while the legacy list remains assigned to each role', async () => {
  const { database, env } = setup();
  try {
    const session = async (staffId: string) => {
      const token = crypto.randomUUID();
      const now = new Date();
      database
        .prepare(
          `INSERT INTO sessions(token_hash,kind,staff_id,token_version,created_at,expires_at)
          SELECT ?,'staff',id,auth_version,?,? FROM staff WHERE id=?`,
        )
        .run(
          await hash(token),
          now.toISOString(),
          new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          staffId,
        );
      return `manspick_staff=${token}`;
    };
    const request = (path: string, cookie = '') =>
      handleRequest(
        new Request(`http://localhost:8787/api${path}`, {
          headers: { Cookie: cookie, 'X-Manspick-Surface': 'admin' },
        }),
        env,
      );
    assert.equal((await request('/shoots/board')).status, 401);
    const director = await session('demo-director');
    assert.equal((await request('/shoots/board', director)).status, 403);
    assert.equal((await request('/shoots', director)).status, 200);
    const staff = await session('demo-staff');
    assert.equal((await request('/shoots/board', staff)).status, 200);
  } finally {
    database.close();
  }
});

test('board summaries use ordered addon snapshots without per-shoot queries or current catalog names', async (context) => {
  const { database, env } = setup();
  const first = context.mock.method(LocalStatement.prototype, 'first');
  const all = context.mock.method(LocalStatement.prototype, 'all');
  try {
    database.exec(`
      DELETE FROM shoot_addons;
      INSERT INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price) VALUES
        ('demo-preparation','rental','예약 당시 대여',2,25000),
        ('demo-preparation','hair','예약 당시 헤어',1,70000);
      UPDATE addons SET name='새 상품명',active=0;
    `);
    const result = await listShoots(env, {
      kind: 'staff',
      role: 'admin',
      id: 'demo-admin',
      name: '대표',
    });
    assert.deepEqual(result.shoots.find((shoot) => shoot.id === 'demo-preparation')?.addons, [
      { id: 'hair', name: '예약 당시 헤어' },
      { id: 'rental', name: '예약 당시 대여' },
    ]);
    assert.deepEqual(result.shoots.find((shoot) => shoot.id === 'demo-payment')?.addons, []);
    const reads = first.mock.callCount() + all.mock.callCount();
    assert.ok(reads > 0 && reads <= 3, 'list queries must not grow once per shoot');
  } finally {
    database.close();
  }
});

test('addon summaries retain customer/director scope', async () => {
  const { database, env } = setup();
  try {
    database.exec(`
      DELETE FROM shoot_addons;
      INSERT INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price) VALUES
        ('demo-preparation','hair','준비 촬영 전용 옵션',1,70000),
        ('demo-result','rental','별도 촬영 옵션',1,25000);
      UPDATE shoots SET director_id=NULL WHERE id='demo-result';
    `);
    const customer = await listShoots(env, {
      kind: 'customer',
      role: 'customer',
      id: 'demo-preparation',
      shootId: 'demo-preparation',
      name: '고객',
    });
    assert.deepEqual(
      customer.shoots.map((shoot) => shoot.id),
      ['demo-preparation'],
    );
    assert.deepEqual(customer.shoots[0]?.addons, [{ id: 'hair', name: '준비 촬영 전용 옵션' }]);
    const director = await listShoots(env, {
      kind: 'staff',
      role: 'director',
      id: 'demo-director',
      name: '담당자',
    });
    assert.ok(!director.shoots.some((shoot) => shoot.id === 'demo-result'));
  } finally {
    database.close();
  }
});
