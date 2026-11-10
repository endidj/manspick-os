// 로컬 저장소로 API의 업무 규칙과 HTTP 응답·인증·권한 계약을 함께 확인합니다.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import {
  assertTransition,
  holdExpiry,
  requiredSlots,
  STATUS_DEFINITIONS,
} from '../packages/domain/src/index.ts';
import { handleRequest } from '../apps/server/src/http/app.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';
import type {
  OperationsSettingsDTO,
  ScheduleDTO,
  SessionDTO,
  SettingsHistoryEntryDTO,
  StaffAccountDTO,
} from '@manspick/contracts';
import testWorker from '../infra/api-test.ts';

test('staff account changes are administrator-only, revoke credentials and write audit history', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  db.database.exec("UPDATE sessions SET token_version=NULL WHERE staff_id='demo-staff'");
  assert.equal((await api('/api/session', { cookie: staff })).status, 200);
  assert.equal((await setup().api('/api/session', { cookie: staff })).status, 401);
  const accounts = (cookie?: string) => api('/api/staff', { cookie });
  const write = (path: string, body: unknown, cookie = admin) =>
    api(`/api/staff${path}`, { method: 'POST', body, cookie });
  await expectError(await accounts(), 401, 'UNAUTHENTICATED');
  await expectError(await accounts(staff), 403, 'FORBIDDEN');
  await expectError(
    await write('', { name: '새 직원', email: 'new@example.test', role: 'admin' }, staff),
    403,
    'FORBIDDEN',
  );
  const created = await write('', { name: ' 새 직원 ', email: 'NEW@example.test ', role: 'staff' });
  assert.equal(created.status, 201);
  const { data: newStaff } = (await created.json()) as { data: StaffAccountDTO };
  assert.deepEqual(newStaff, {
    id: newStaff.id,
    name: '새 직원',
    email: 'new@example.test',
    role: 'staff',
    active: true,
    version: 0,
  });
  assert.equal(
    (await write('', { name: '중복', email: 'NEW@example.test', role: 'staff' })).status,
    409,
  );
  assert.equal((await write('', { name: '오류', email: 'bad', role: 'owner' })).status, 400);
  assert.equal(
    (await write('/demo-admin', { role: 'staff', active: false, version: 0 })).status,
    409,
  );

  db.database
    .prepare('INSERT INTO staff_login_tokens(token_hash,staff_id,expires_at) VALUES(?,?,?)')
    .run('pending-link', 'demo-staff', '2999-01-01T00:00:00.000Z');
  const deactivate = { role: 'staff', active: false, version: 0 };
  const results = await Promise.all([
    write('/demo-staff', deactivate),
    write('/demo-staff', deactivate),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM staff_login_tokens').get()?.n, 0);
  assert.equal((await api('/api/session', { cookie: staff })).status, 401);
  const reactivated = await write('/demo-staff', { role: 'staff', active: true, version: 1 });
  assert.equal(reactivated.status, 200);
  assert.equal((await api('/api/session', { cookie: staff })).status, 401);
  const nextSession = await login(api, 'staff');
  assert.equal((await write('/demo-staff/revoke-sessions', { version: 2 })).status, 200);
  assert.equal((await api('/api/session', { cookie: nextSession })).status, 401);

  const directory = (await (await accounts(admin)).json()) as { data: StaffAccountDTO[] };
  assert.equal(directory.data.find((account) => account.id === 'demo-staff')?.version, 3);
  const history = await api('/api/settings/history', { cookie: admin });
  const { data } = (await history.json()) as { data: { items: SettingsHistoryEntryDTO[] } };
  const changes = data.items.filter((item) => item.settingKey === 'staff:demo-staff');
  assert.deepEqual(changes.map((item) => item.action).sort(), [
    'revoke_sessions',
    'update',
    'update',
  ]);
  assert.ok(changes.every((item) => item.actorName === '데모 대표'));
  assert.ok(changes.every((item) => item.targetName === '데모 운영 담당'));
  assert.ok(!JSON.stringify(changes).includes('@'));
});

test('failed staff audit rolls back the account change and keeps its session valid', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  db.database.exec(`CREATE TRIGGER fail_staff_audit BEFORE INSERT ON audit_events
    WHEN NEW.target_type='staff' BEGIN SELECT RAISE(ABORT,'AUDIT_FAILURE'); END`);
  const result = await api('/api/staff/demo-staff', {
    method: 'POST',
    cookie: admin,
    body: { role: 'director', active: false, version: 0 },
  });
  assert.equal(result.status, 500);
  const session = await api('/api/session', { cookie: staff });
  assert.equal(session.status, 200);
  assert.equal(((await session.json()) as { data: SessionDTO }).data.actor.role, 'staff');
  assert.equal(
    db.database.prepare("SELECT auth_version FROM staff WHERE id='demo-staff'").get()?.auth_version,
    0,
  );
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM audit_events').get()?.n, 0);
});

test('revoking an administrator session also blocks its pending account mutation', async () => {
  const { api, env } = setup();
  const admin = await login(api, 'admin');
  const otherSession = await login(api, 'admin');
  let signalRead: () => void = () => {};
  let resume: () => void = () => {};
  const reading = new Promise<void>((resolve) => {
    signalRead = resolve;
  });
  const ready = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const body = new ReadableStream<Uint8Array>(
    {
      async pull(controller) {
        signalRead();
        await ready;
        controller.enqueue(
          new TextEncoder().encode(
            JSON.stringify({ name: '새 직원', email: 'delayed@example.test', role: 'admin' }),
          ),
        );
        controller.close();
      },
    },
    { highWaterMark: 0 },
  );
  const input: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers: { Cookie: admin, Origin: 'http://localhost:3002', 'Content-Type': 'application/json' },
    body,
    duplex: 'half',
  };
  const pending = handleRequest(new Request('http://localhost:8787/api/staff', input), env);
  await reading;
  try {
    assert.equal(
      (
        await api('/api/staff/demo-admin/revoke-sessions', {
          method: 'POST',
          body: { version: 0 },
          cookie: otherSession,
        })
      ).status,
      200,
    );
  } finally {
    resume();
  }
  await expectError(await pending, 409, 'CONFLICT');
});

test('a new booking skips a default retoucher whose staff role has changed', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const date = futureBookingDate();
  db.database
    .prepare('INSERT OR REPLACE INTO retoucher_rules(weekday,retoucher_id) VALUES(?,?)')
    .run(new Date(`${date}T12:00:00Z`).getUTCDay(), 'demo-retoucher');
  assert.equal(
    (
      await api('/api/staff/demo-retoucher', {
        method: 'POST',
        cookie: admin,
        body: { role: 'staff', active: true, version: 0 },
      })
    ).status,
    200,
  );
  const booking = await api('/api/start', {
    method: 'POST',
    body: bookingInput(date, '11:00', '01000002420'),
  });
  assert.equal(booking.status, 201);
  const { localAccess } = await bookingResponse(booking);
  assert.ok(localAccess);
  assert.equal(
    db.database.prepare('SELECT retoucher_id FROM shoots WHERE id=?').get(localAccess.shootId)
      ?.retoucher_id,
    null,
  );
});

test('staff email links require an active allowlisted employee and can only be used once', async () => {
  const { env: local, db } = setup('false');
  const sent: { to: string; text: string }[] = [];
  const adminOrigin = 'https://admin.example.test';
  const env: Env = {
    ...local,
    STAFF_APP_ORIGIN: adminOrigin,
    STAFF_EMAIL_DOMAIN: 'manspick.example',
    STAFF_EMAIL_FROM: 'login@manspick.example',
    EMAIL: {
      async send(message) {
        sent.push(message);
      },
    },
  };
  const request = (path: string, body?: unknown, origin = adminOrigin, cookie?: string) =>
    handleRequest(
      new Request(origin + '/api' + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          Origin: origin,
          'X-Manspick-Surface': 'admin',
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      env,
    );
  assert.deepEqual(await (await request('/auth/staff/options')).json(), {
    data: { demo: false, email: true },
  });
  assert.equal((await request('/demo/session', { role: 'admin' })).status, 404);
  assert.equal(
    (
      await request(
        '/auth/staff/request',
        { email: 'demo-staff@manspick.example' },
        'https://preview.example.test',
      )
    ).status,
    503,
  );
  for (const email of [
    'outsider@manspick.example',
    'demo-staff@fake.manspick.example',
    'DEMO-STAFF@MANSPICK.EXAMPLE',
  ]) {
    const response = await request('/auth/staff/request', { email });
    assert.equal(response.status, 202);
    assert.deepEqual(await response.json(), { data: { accepted: true } });
  }
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.to, 'demo-staff@manspick.example');
  assert.ok(sent[0]!.text.includes(adminOrigin + '/#staffToken='));
  const token = sent[0]!.text.match(/staffToken=([a-f\d]{64})/)?.[1];
  assert.ok(token);
  assert.equal(
    db.database
      .prepare('SELECT COUNT(*) AS n FROM staff_login_tokens WHERE token_hash=?')
      .get(token)?.n,
    0,
  );
  const attempts = await Promise.all([
    request('/auth/staff/confirm', { token }),
    request('/auth/staff/confirm', { token }),
  ]);
  assert.deepEqual(attempts.map((response) => response.status).sort(), [200, 401]);
  const cookie = attempts.find((response) => response.ok)?.headers.get('Set-Cookie');
  assert.ok(cookie?.includes('HttpOnly; SameSite=Lax; Secure'));
  const session = (await (await request('/session', undefined, adminOrigin, cookie!)).json()) as {
    data: SessionDTO;
  };
  assert.equal(session.data.actor.role, 'staff');
  await request('/auth/staff/request', { email: sent[0]!.to });
  const secondToken = sent[1]!.text.match(/staffToken=([a-f\d]{64})/)?.[1];
  assert.ok(secondToken);
  db.database
    .prepare('UPDATE staff_login_tokens SET expires_at=?')
    .run(new Date(Date.now() - 1000).toISOString());
  await expectError(
    await request('/auth/staff/confirm', { token: secondToken }),
    401,
    'STAFF_LINK_INVALID',
  );
  await request('/auth/staff/request', { email: sent[0]!.to });
  const thirdToken = sent[2]!.text.match(/staffToken=([a-f\d]{64})/)?.[1];
  assert.ok(thirdToken);
  db.database.exec("UPDATE staff SET active=0 WHERE id='demo-staff'");
  await expectError(
    await request('/auth/staff/confirm', { token: thirdToken }),
    401,
    'STAFF_LINK_INVALID',
  );
  assert.equal((await request('/session', undefined, adminOrigin, cookie!)).status, 401);
});

test('operator reissues a customer link and revokes both the old token and active sessions', async () => {
  const { api, db } = setup();
  const staff = await login(api, 'staff');
  const director = await login(api, 'director');
  const customer = await customerLogin(api, 'demo-payment-access', '1001');
  const issue = (cookie?: string) =>
    api('/api/auth/customer-link/demo-payment', { method: 'POST', cookie });
  await expectError(await issue(), 401, 'UNAUTHENTICATED');
  await expectError(await issue(director), 403, 'FORBIDDEN');
  await expectError(await issue(customer), 403, 'FORBIDDEN');
  const result = await issue(staff);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  const data = ((await result.json()) as { data: { url: string; recipientPhone: string } }).data;
  assert.equal(data.recipientPhone, '01000001001');
  const url = new URL(data.url);
  assert.equal(url.origin, 'http://localhost:3001');
  const token = url.pathname.split('/').at(-1)!;
  assert.equal(token.length, 64);
  await expectError(await api('/api/session', { cookie: customer }), 401, 'UNAUTHENTICATED');
  await expectError(
    await api('/api/auth/customer', {
      method: 'POST',
      body: { token: 'demo-payment-access', last4: '1001' },
    }),
    401,
    'AUTH_FAILED',
  );
  const next = await customerLogin(api, token, '1001');
  assert.equal((await api('/api/shoots/demo-payment', { cookie: next })).status, 200);
  assert.equal((await api('/api/shoots/demo-selection', { cookie: next })).status, 404);
  assert.equal(
    db.database.prepare("SELECT token_version FROM shoots WHERE id='demo-payment'").get()
      ?.token_version,
    2,
  );
  assert.equal(
    db.database
      .prepare(
        "SELECT COUNT(*) AS n FROM timeline WHERE shoot_id='demo-payment' AND reason LIKE '고객 접속 링크 발급%'",
      )
      .get()?.n,
    1,
  );
});

class LocalStatement {
  constructor(database: DatabaseSync, sql: string, values: SQLInputValue[] = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }
  database: DatabaseSync;
  sql: string;
  values: SQLInputValue[];
  bind(...values: SQLInputValue[]) {
    return new LocalStatement(this.database, this.sql, values);
  }
  async first(column?: string) {
    const row = this.database.prepare(this.sql).get(...this.values);
    return column ? (row?.[column] ?? null) : (row ?? null);
  }
  execute() {
    const results = this.database.prepare(this.sql).all(...this.values);
    const changes = this.database.prepare('SELECT changes() AS n').get()?.n ?? 0;
    return { success: true, results, meta: { changes } };
  }
  async all() {
    return this.execute();
  }
  async run() {
    return this.execute();
  }
}
class LocalD1 {
  database = new DatabaseSync(':memory:');
  constructor() {
    for (const file of readdirSync(new URL('../infra/migrations/', import.meta.url))
      .filter((name) => name.endsWith('.sql'))
      .sort())
      this.database.exec(
        readFileSync(new URL(`../infra/migrations/${file}`, import.meta.url), 'utf8'),
      );
    this.database.exec(readFileSync(new URL('../infra/seed.sql', import.meta.url), 'utf8'));
  }
  prepare(sql: string) {
    return new LocalStatement(this.database, sql);
  }
  async batch(statements: LocalStatement[]) {
    this.database.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map((statement) => statement.execute());
      this.database.exec('COMMIT');
      return results;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }
}
function setup(local = 'true') {
  const db = new LocalD1();
  const objects = new Map<string, ArrayBuffer>();
  const env = {
    DB: db as unknown as D1Database,
    LOCAL_DEMO: local,
    BUCKET: {
      async put(key: string, body: ArrayBuffer) {
        objects.set(key, body);
      },
      async get(key: string) {
        const data = objects.get(key);
        return data ? { body: data } : null;
      },
      async delete(key: string) {
        objects.delete(key);
      },
    } as unknown as R2Bucket,
  } satisfies Env;
  async function api(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      cookie?: string;
      surface?: string;
      origin?: string;
      hostname?: string;
    } = {},
  ) {
    const headers = new Headers({ Origin: options.origin ?? 'http://localhost:3002' });
    if (options.cookie) headers.set('Cookie', options.cookie);
    if (options.surface) headers.set('X-Manspick-Surface', options.surface);
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    return handleRequest(
      new Request(`http://${options.hostname ?? 'localhost'}:8787${path}`, {
        method: options.method ?? 'GET',
        headers,
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      }),
      env,
    );
  }
  return { env, db, api, objects };
}

test('settings history is administrator scoped and preserves saved before and after values', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  assert.equal((await api('/api/settings/history', { cookie: staff })).status, 403);
  db.database
    .prepare(
      "INSERT INTO settings_history(id,actor_id,setting_key,next_json,created_at) VALUES('legacy','demo-admin','template:legacy',?,'2020-01-01 00:00:00')",
    )
    .run(JSON.stringify({ title: '기존 안내' }));
  const value = {
    bankName: '로컬 검증 은행',
    accountNumber: '테스트 전용',
    accountHolder: '가상 예금주',
  };
  assert.equal(
    (
      await api('/api/settings', {
        cookie: admin,
        method: 'POST',
        body: { type: 'payment_instructions', value },
      })
    ).status,
    200,
  );
  const response = await api('/api/settings/history', { cookie: admin });
  assert.equal(response.status, 200);
  const history = ((await response.json()) as { data: { items: SettingsHistoryEntryDTO[] } }).data
    .items;
  assert.equal(history.length, 2);
  assert.equal(history[0].settingKey, 'payment_instructions');
  assert.equal(history[0].action, 'update');
  assert.deepEqual(history[0].next, value);
  assert.equal(history[0].previous, null);
  assert.ok(history[0].actorName);
  assert.equal(history[1].settingKey, 'template:legacy');
  assert.deepEqual(history[1].next, { title: '기존 안내' });
  db.database.close();
});

test('operations policy saves only validated administrator changes and preserves booked deadlines', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  const value = {
    holdHours: 12,
    holdCutoffHours: 3,
    bookingHorizonWeeks: 4,
    slotTimes: ['11:00', '15:00'],
    surveyLeadDays: 5,
    outfitLeadDays: 3,
  };
  const before = db.database
    .prepare('SELECT id,starts_at,survey_due_at,outfit_due_at FROM shoots ORDER BY id')
    .all();
  const save = (policy: unknown, cookie = admin) =>
    api('/api/settings', {
      cookie,
      method: 'POST',
      body: { type: 'operations_policy', value: policy },
    });
  assert.equal((await save(value, staff)).status, 403);
  assert.equal((await save({ ...value, slotTimes: ['12:00'] })).status, 400);
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM audit_events').get()?.n, 0);
  const response = await save(value);
  assert.equal(response.status, 200, await response.clone().text());
  assert.deepEqual(((await response.json()) as { data: { policy: unknown } }).data.policy, value);
  const row = db.database
    .prepare(
      "SELECT previous_json,next_json FROM audit_events WHERE target_type='setting' AND target_id='operations_policy'",
    )
    .get()!;
  assert.deepEqual(JSON.parse(String(row.next_json)), value);
  assert.equal(JSON.parse(String(row.previous_json)).holdHours, 24);
  assert.deepEqual(
    db.database
      .prepare('SELECT id,starts_at,survey_due_at,outfit_due_at FROM shoots ORDER BY id')
      .all(),
    before,
  );
  db.database.close();
});

test('concurrent operations policy updates cannot silently overwrite each other', async () => {
  const { api, db } = setup();
  const cookie = await login(api, 'admin');
  const originalBatch = db.batch.bind(db);
  let waiting = 0;
  let release: () => void = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  // 두 요청이 같은 설정을 읽은 뒤에만 저장하게 해 실제 경합을 재현합니다.
  db.batch = async (statements: LocalStatement[]) => {
    if (
      statements.some(
        (statement) =>
          statement.sql.includes('INSERT INTO audit_events') &&
          statement.values.includes('operations_policy'),
      )
    ) {
      waiting += 1;
      if (waiting === 2) release();
      await ready;
    }
    return originalBatch(statements);
  };

  const value = {
    holdHours: 24,
    holdCutoffHours: 2,
    bookingHorizonWeeks: 8,
    slotTimes: ['11:00', '13:00', '15:00', '17:00'],
    surveyLeadDays: 3,
    outfitLeadDays: 2,
  };
  const responses = await Promise.all(
    [12, 36].map((holdHours) =>
      api('/api/settings', {
        cookie,
        method: 'POST',
        body: { type: 'operations_policy', value: { ...value, holdHours } },
      }),
    ),
  );
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(
    db.database
      .prepare(
        "SELECT COUNT(*) AS n FROM audit_events WHERE target_type='setting' AND target_id='operations_policy'",
      )
      .get()?.n,
    1,
  );
  db.database.close();
});

test('stopping extra retouch sales keeps included selection open and blocks new paid orders', async () => {
  const { api, db } = setup();
  db.database.exec(
    "INSERT INTO addons(id,name,price,description,max_quantity,active) VALUES('extra_retouch','추가 보정',15000,'셀렉 전용',100,0)",
  );
  const cookie = await customerLogin(api, 'demo-selection-access', '1003');
  const detail = await api('/api/shoots/demo-selection', { cookie });
  assert.equal(detail.status, 200);
  const data = (
    (await detail.json()) as {
      data: { extraRetouchAvailable: boolean; retouchUnitPrice: number };
    }
  ).data;
  assert.equal(data.extraRetouchAvailable, false);
  assert.equal(data.retouchUnitPrice, 15000);
  const photoIds = Array.from({ length: 8 }, (_, index) => `demo-selection-photo-${index + 1}`);
  const action = (body: unknown) =>
    api('/api/shoots/demo-selection/actions', { cookie, method: 'POST', body });

  await expectError(
    await action({ type: 'submit_selection', photoIds }),
    409,
    'EXTRA_RETOUCH_UNAVAILABLE',
  );
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM retouch_orders').get()?.n, 0);
  const included = await action({ type: 'submit_selection', photoIds: photoIds.slice(0, 7) });
  assert.equal(included.status, 200, await included.clone().text());
  assert.equal(
    db.database.prepare("SELECT status FROM shoots WHERE id='demo-selection'").get()?.status,
    'retouch_assigned',
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
      .get()?.n,
    1,
  );
  db.database.exec(
    "UPDATE retouch_jobs SET state='complete' WHERE shoot_id='demo-selection'; UPDATE shoots SET status='delivered' WHERE id='demo-selection'",
  );
  await expectError(
    await action({ type: 'request_extra_retouch', photoIds: [photoIds[7]] }),
    409,
    'EXTRA_RETOUCH_UNAVAILABLE',
  );
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM retouch_orders').get()?.n, 0);
  assert.equal(
    db.database
      .prepare(
        "SELECT COUNT(*) AS n FROM selections WHERE shoot_id='demo-selection' AND round='extra'",
      )
      .get()?.n,
    0,
  );
  db.database.close();
});

test('preparation confirmations persist per customer and require every configured guide', async () => {
  const { api, db } = setup();
  const staff = await login(api, 'staff');
  const customer = await customerLogin(api, 'demo-preparation-access', '1002');
  const action = (body: unknown, cookie = customer) =>
    api('/api/shoots/demo-preparation/actions', { method: 'POST', cookie, body });
  const preparation = {
    location: {
      area: '테스트 동네',
      meetingPlace: '로컬 테스트 장소',
      mapUrl: null,
      parkingNote: '주차 없음',
      parkingUrl: null,
    },
    hair: null,
    guides: [
      {
        id: 'outfits',
        title: '의상 준비',
        summary: '의상을 준비해주세요',
        body: '로컬 준비 안내',
        readAt: null,
      },
    ],
  };
  await expectError(await action({ type: 'save_preparation', preparation }), 403, 'FORBIDDEN');
  assert.equal((await action({ type: 'save_preparation', preparation }, staff)).status, 200);
  await expectError(await action({ type: 'confirm_preparation' }), 409, 'GUIDES_UNREAD');
  assert.equal((await action({ type: 'mark_preparation_read', guideId: 'outfits' })).status, 200);
  assert.equal((await action({ type: 'confirm_preparation' })).status, 200);
  const detail = (await (
    await api('/api/shoots/demo-preparation', { cookie: customer })
  ).json()) as { data: { preparation: { confirmedAt: string; guides: { readAt: string }[] } } };
  assert.ok(detail.data.preparation.confirmedAt);
  assert.ok(detail.data.preparation.guides[0]?.readAt);
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM guide_checks WHERE shoot_id='demo-preparation'")
      .get()?.n,
    1,
  );
});

test('field completion and director selection require persisted checks and an audit reason', async () => {
  const { api, db } = setup();
  const director = await login(api, 'director');
  const customer = await customerLogin(api, 'demo-preparation-access', '1002');
  db.database.prepare("UPDATE shoots SET status='shooting' WHERE id='demo-preparation'").run();
  const action = (body: unknown, cookie = director) =>
    api('/api/shoots/demo-preparation/actions', { method: 'POST', cookie, body });
  await expectError(await action({ type: 'complete_field' }, customer), 403, 'FORBIDDEN');
  await expectError(await action({ type: 'complete_field' }), 409, 'FIELD_INCOMPLETE');
  await expectError(
    await action({
      type: 'save_field_checklist',
      checks: [],
      selector: 'director',
      reason: '',
      note: '',
    }),
    400,
    'INVALID_INPUT',
  );
  const checks = [
    'arrival',
    'addons',
    'icebreaking',
    'sequence',
    'outfits',
    'shooting',
    'midcheck',
    'closing',
  ];
  assert.equal(
    (
      await action({
        type: 'save_field_checklist',
        checks,
        selector: 'director',
        reason: '고객 현장 요청',
        note: '로컬 확인',
      })
    ).status,
    200,
  );
  assert.equal((await action({ type: 'complete_field' })).status, 200);
  assert.equal(
    db.database.prepare("SELECT status FROM shoots WHERE id='demo-preparation'").get()?.status,
    'shoot_complete',
  );
  assert.equal(
    db.database.prepare("SELECT select_by FROM shoots WHERE id='demo-preparation'").get()
      ?.select_by,
    'director',
  );
});

test('manual assignment checks role, reason, eligibility and occupied slots atomically', async () => {
  const { api, db } = setup();
  const staff = await login(api, 'staff');
  const director = await login(api, 'director');
  db.database
    .prepare(
      "INSERT INTO staff(id,name,email,role) VALUES('director-2','로컬 디렉터 2','local2@example.invalid','director')",
    )
    .run();
  const action = (body: unknown, cookie = staff) =>
    api('/api/shoots/demo-payment/actions', { method: 'POST', cookie, body });
  await expectError(
    await action({ type: 'assign_staff', directorId: 'director-2', reason: '테스트' }, director),
    403,
    'FORBIDDEN',
  );
  await expectError(
    await action({ type: 'assign_staff', directorId: 'director-2', reason: '' }),
    400,
    'INVALID_INPUT',
  );
  db.database.exec(
    "INSERT INTO slots(id,director_id,date,time,shoot_id) SELECT 'test-occupied','director-2',date,time,'demo-preparation' FROM slots WHERE shoot_id='demo-payment' LIMIT 1",
  );
  await expectError(
    await action({ type: 'assign_staff', directorId: 'director-2', reason: '중복 시간 검사' }),
    409,
    'ASSIGNMENT_UNAVAILABLE',
  );
  assert.equal(
    db.database.prepare("SELECT director_id FROM shoots WHERE id='demo-payment'").get()
      ?.director_id,
    'demo-director',
  );
  assert.equal(
    db.database.prepare("SELECT director_id FROM slots WHERE shoot_id='demo-payment'").get()
      ?.director_id,
    'demo-director',
  );
  db.database.exec("DELETE FROM slots WHERE id='test-occupied'");
  assert.equal(
    (await action({ type: 'assign_staff', directorId: 'director-2', reason: '업무 재배정' }))
      .status,
    200,
  );
  assert.equal(
    db.database.prepare("SELECT director_id FROM shoots WHERE id='demo-payment'").get()
      ?.director_id,
    'director-2',
  );
  assert.equal(
    db.database.prepare("SELECT director_id FROM slots WHERE shoot_id='demo-payment'").get()
      ?.director_id,
    'director-2',
  );
  const schedule = await api('/api/schedule?week=' + new Date().toISOString().slice(0, 10), {
    cookie: staff,
  });
  assert.equal(schedule.status, 200);
});

test('operations editing is admin scoped and original external links remain gated by review approval', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  const customer = await customerLogin(api, 'demo-result-access', '1004');
  const value = { bankName: '로컬 은행', accountNumber: 'TEST-ONLY', accountHolder: '로컬 시연' };
  await expectError(
    await api('/api/settings', {
      method: 'POST',
      cookie: staff,
      body: { type: 'payment_instructions', value },
    }),
    403,
    'FORBIDDEN',
  );
  assert.equal(
    (
      await api('/api/settings', {
        method: 'POST',
        cookie: admin,
        body: { type: 'payment_instructions', value },
      })
    ).status,
    200,
  );
  const action = (body: unknown) =>
    api('/api/shoots/demo-result/actions', { method: 'POST', cookie: staff, body });
  await expectError(
    await action({
      type: 'save_file_link',
      kind: 'original',
      label: '원본',
      url: 'javascript:alert(1)',
      visible: true,
    }),
    400,
    'INVALID_URL',
  );
  assert.equal(
    (
      await action({
        type: 'save_file_link',
        kind: 'original',
        label: '원본',
        url: 'https://example.invalid/original',
        visible: true,
      })
    ).status,
    200,
  );
  const detail = (await (await api('/api/shoots/demo-result', { cookie: customer })).json()) as {
    data: { fileLinks: unknown[] };
  };
  assert.equal(detail.data.fileLinks.length, 0);
  assert.equal(
    (
      await api('/api/notifications/demo-outbox/complete', {
        method: 'POST',
        cookie: staff,
        body: {},
      })
    ).status,
    200,
  );
  assert.equal(
    db.database.prepare("SELECT state FROM notifications WHERE id='demo-outbox'").get()?.state,
    'manually_confirmed',
  );
});

test('assignment rules validate complete weekdays and eligible staff before replacing existing rules', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const update = (body: unknown) => api('/api/settings', { method: 'POST', cookie: admin, body });
  await expectError(
    await update({ type: 'director_skills', directorId: 'demo-staff', addonIds: ['hair'] }),
    400,
    'INVALID_ASSIGNEE',
  );
  await expectError(
    await update({ type: 'director_skills', directorId: 'demo-director', addonIds: ['missing'] }),
    400,
    'INVALID_ADDONS',
  );
  assert.equal(
    (
      await update({
        type: 'director_skills',
        directorId: 'demo-director',
        addonIds: ['hair', 'rental'],
      })
    ).status,
    200,
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM director_skills WHERE director_id='demo-director'")
      .get()?.n,
    2,
  );
  await expectError(
    await update({
      type: 'retoucher_rules',
      rules: [{ weekday: 0, retoucherId: 'demo-retoucher' }],
    }),
    400,
    'INVALID_RULES',
  );
  const rules = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    retoucherId: 'demo-retoucher',
  }));
  await expectError(
    await update({
      type: 'retoucher_rules',
      rules: rules.map((rule) => ({ ...rule, retoucherId: 'demo-director' })),
    }),
    400,
    'INVALID_ASSIGNEE',
  );
  assert.equal((await update({ type: 'retoucher_rules', rules })).status, 200);
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM retoucher_rules').get()?.n, 7);
});

test('review approval can publish an external original link without a duplicate R2 upload', async () => {
  const { api, db } = setup();
  const staff = await login(api, 'staff');
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  db.database.exec(`
    UPDATE shoots SET status='delivered' WHERE id='demo-selection';
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by) VALUES('external-review-proof','demo-selection','review','demo/external-review','가상 후기','image/jpeg',1,'demo-selection');
  `);
  const action = (body: unknown, cookie = staff) =>
    api('/api/shoots/demo-selection/actions', { method: 'POST', cookie, body });
  assert.equal(
    (
      await action({
        type: 'save_file_link',
        kind: 'original',
        label: '원본 링크',
        url: 'https://example.invalid/originals',
        visible: false,
      })
    ).status,
    200,
  );
  assert.equal(
    (await action({ type: 'review_submit', uploadId: 'external-review-proof' }, customer)).status,
    200,
  );
  const requestId = db.database
    .prepare("SELECT id FROM requests WHERE shoot_id='demo-selection' AND type='review'")
    .get()?.id;
  assert.equal(
    (await action({ type: 'resolve_request', requestId, decision: 'complete' })).status,
    200,
  );
  const detail = (await (await api('/api/shoots/demo-selection', { cookie: customer })).json()) as {
    data: { fileLinks: { url: string; publishedAt: string | null }[] };
  };
  assert.equal(detail.data.fileLinks[0]?.url, 'https://example.invalid/originals');
  assert.ok(detail.data.fileLinks[0]?.publishedAt);
});

test('review approval releases originals independently of optional review rewards', async (t) => {
  for (const [scenario, campaigns, expectedCampaign] of [
    ['no campaigns', 'DELETE FROM campaigns', undefined],
    [
      'unrelated active campaign',
      "DELETE FROM campaigns; INSERT INTO campaigns(id,name) VALUES('referral','추천')",
      undefined,
    ],
    [
      'disabled review campaign',
      "INSERT INTO campaigns(id,name,active) VALUES('review','후기',0)",
      undefined,
    ],
    [
      'configured active review campaign',
      "INSERT INTO campaigns(id,name) VALUES('review','후기')",
      'review',
    ],
  ] as const) {
    await t.test(scenario, async () => {
      const { api, db } = setup();
      const staff = await login(api, 'staff');
      const customer = await customerLogin(api, 'demo-result-access', '1004');
      db.database.exec(campaigns);
      db.database.exec(`
        INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by)
        VALUES('optional-review-proof','demo-result','review','demo/optional-review','후기','image/jpeg',1,'demo-result');
      `);
      const original = () => api('/api/uploads/demo-original-upload-1/blob', { cookie: customer });
      const action = (body: unknown, cookie = staff) =>
        api('/api/shoots/demo-result/actions', { method: 'POST', cookie, body });
      const submit = () =>
        action({ type: 'review_submit', uploadId: 'optional-review-proof' }, customer);
      assert.equal((await original()).status, 404);
      assert.equal((await submit()).status, 200);
      const requestId = db.database
        .prepare("SELECT id FROM requests WHERE shoot_id='demo-result' AND type='review'")
        .get()?.id;
      const approve = () => action({ type: 'resolve_request', requestId, decision: 'complete' });
      assert.equal((await approve()).status, 200);
      assert.equal((await original()).status, 200);
      const followups = (await (await api('/api/followups', { cookie: staff })).json()) as {
        data: { items: { request: { id: string; state: string } }[] };
      };
      assert.equal(
        followups.data.items.find((item) => item.request.id === requestId)?.request.state,
        'complete',
      );
      await expectError(await approve(), 409, 'REQUEST_CLOSED');
      await expectError(await submit(), 409, 'ALREADY_REVIEWED');
      assert.deepEqual(
        db.database
          .prepare('SELECT campaign_id FROM campaign_claims WHERE request_id=?')
          .all(requestId ?? null)
          .map((claim) => claim.campaign_id),
        expectedCampaign ? [expectedCampaign] : [],
      );
    });
  }
});

async function login(api: ReturnType<typeof setup>['api'], role: string) {
  const response = await api('/api/demo/session', { method: 'POST', body: { role } });
  assert.equal(response.status, 200);
  return response.headers.get('Set-Cookie')!.split(';')[0]!;
}
async function customerLogin(api: ReturnType<typeof setup>['api'], token: string, last4: string) {
  const response = await api('/api/auth/customer', {
    method: 'POST',
    body: { token, last4 },
    origin: 'http://localhost:3001',
  });
  assert.equal(response.status, 200);
  return response.headers.get('Set-Cookie')!.split(';')[0]!;
}

async function expectError(response: Response, status: number, code: string) {
  assert.equal(response.status, status);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.match(response.headers.get('Content-Type') ?? '', /^application\/json/);
  const result = (await response.json()) as { error: { code: string; message: string } };
  assert.equal(result.error.code, code);
  assert.equal(typeof result.error.message, 'string');
  assert.ok(result.error.message.length > 0);
  return result.error;
}

test('extra selection creates an exact pending charge and cannot start retouching before staff payment confirmation', async () => {
  const { api, db } = setup();
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  const staff = await login(api, 'staff');
  const photoIds = Array.from({ length: 8 }, (_, i) => `demo-selection-photo-${i + 1}`);
  const response = await api('/api/shoots/demo-selection/actions', {
    method: 'POST',
    cookie: customer,
    body: { type: 'submit_selection', photoIds },
  });
  assert.equal(response.status, 200);
  const charge = db.database
    .prepare(
      "SELECT id,amount FROM payments WHERE shoot_id='demo-selection' AND kind='selection_extra'",
    )
    .get();
  assert.equal(charge?.amount, 10000);
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
      .get()?.n,
    0,
  );
  assert.equal(
    (
      await api('/api/shoots/demo-selection/actions', {
        method: 'POST',
        cookie: staff,
        body: { type: 'confirm_payment', paymentId: charge?.id },
      })
    ).status,
    200,
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
      .get()?.n,
    1,
  );
  assert.equal(
    db.database.prepare("SELECT status FROM shoots WHERE id='demo-selection'").get()?.status,
    'retouch_assigned',
  );
  assert.equal(
    (
      await api('/api/shoots/demo-selection/actions', {
        method: 'POST',
        cookie: staff,
        body: { type: 'confirm_payment', paymentId: charge?.id },
      })
    ).status,
    200,
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
      .get()?.n,
    1,
  );
});

test('retoucher candidate access follows assigned rounds and never exposes unpaid extra selections', async () => {
  const { api, db } = setup();
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  const staff = await login(api, 'staff');
  const retoucher = await login(api, 'retoucher');
  const action = (body: unknown, cookie = customer) =>
    api('/api/shoots/demo-selection/actions', { method: 'POST', cookie, body });
  assert.equal(
    (await action({ type: 'submit_selection', photoIds: ['demo-selection-photo-1'] })).status,
    200,
  );
  db.database.exec(
    "UPDATE retouch_jobs SET state='complete' WHERE shoot_id='demo-selection'; UPDATE shoots SET status='delivered' WHERE id='demo-selection'",
  );
  assert.equal(
    (await action({ type: 'request_extra_retouch', photoIds: ['demo-selection-photo-2'] })).status,
    200,
  );
  const detail = (await (
    await api('/api/shoots/demo-selection', { cookie: retoucher })
  ).json()) as { data: { photos: { id: string }[] } };
  assert.ok(detail.data.photos.some((photo) => photo.id === 'demo-selection-photo-1'));
  assert.ok(!detail.data.photos.some((photo) => photo.id === 'demo-selection-photo-2'));
  const extraUpload = db.database
    .prepare("SELECT upload_id FROM photos WHERE id='demo-selection-photo-2'")
    .get()?.upload_id;
  assert.equal((await api(`/api/uploads/${extraUpload}/blob`, { cookie: retoucher })).status, 404);
  db.database.exec(
    "INSERT INTO staff(id,name,email,role) VALUES('other-extra-retoucher','추가 가상 보정가','other-extra@example.invalid','retoucher')",
  );
  assert.equal(
    (
      await action(
        { type: 'assign_staff', retoucherId: 'other-extra-retoucher', reason: '추가 작업 분리' },
        staff,
      )
    ).status,
    200,
  );
  const paymentId = db.database
    .prepare("SELECT id FROM payments WHERE shoot_id='demo-selection' AND kind='extra_retouch'")
    .get()?.id;
  assert.equal((await action({ type: 'confirm_payment', paymentId }, staff)).status, 200);
  assert.equal((await api(`/api/uploads/${extraUpload}/blob`, { cookie: retoucher })).status, 404);
});

test('a reassigned revision retoucher can read exactly the requested previous results', async () => {
  const { api, db } = setup();
  const customer = await customerLogin(api, 'demo-result-access', '1004');
  const retoucher = await login(api, 'retoucher');
  db.database.exec(
    "INSERT INTO staff(id,name,email,role) VALUES('previous-retoucher','이전 가상 보정가','previous@example.invalid','retoucher'); UPDATE retouch_jobs SET retoucher_id='previous-retoucher' WHERE id='demo-result-job'; UPDATE uploads SET retouch_job_id='demo-result-job',uploaded_by='previous-retoucher' WHERE shoot_id='demo-result' AND kind='retouched'",
  );
  assert.equal(
    (
      await api('/api/shoots/demo-result/actions', {
        method: 'POST',
        cookie: customer,
        body: {
          type: 'request_revision',
          items: [{ photoId: 'demo-result-photo-1', comment: '가상 수정 요청' }],
        },
      })
    ).status,
    200,
  );
  assert.equal(
    (await api('/api/uploads/demo-result-upload-1/blob', { cookie: retoucher })).status,
    200,
  );
  assert.equal(
    (await api('/api/uploads/demo-result-upload-2/blob', { cookie: retoucher })).status,
    404,
  );
});

test('manual templates filter by persisted conditions and scope completion to assigned directors', async () => {
  const { api, db } = setup();
  const admin = await login(api, 'admin');
  const director = await login(api, 'director');
  const customer = await customerLogin(api, 'demo-preparation-access', '1002');
  const path = '/api/shoots/demo-preparation/messages';
  await expectError(await api(path, { cookie: customer }), 403, 'FORBIDDEN');
  const response = await api(path, { cookie: director });
  assert.equal(response.status, 200);
  const data = (await response.json()) as {
    data: { templates: { key: string; renderedBody: string; sent: boolean }[] };
  };
  assert.equal(data.data.templates.length, 1);
  assert.equal(data.data.templates[0]?.key, '06-preparation');
  assert.ok(data.data.templates[0]?.renderedBody.includes('데모 고객 · 준비님'));
  assert.ok(data.data.templates[0]?.renderedBody.includes('의상 2벌'));
  const complete = () =>
    api(`${path}/06-preparation/complete`, { method: 'POST', cookie: director, body: {} });
  assert.equal((await complete()).status, 200);
  assert.equal((await complete()).status, 200);
  assert.equal(
    db.database
      .prepare(
        "SELECT COUNT(*) AS n FROM notifications WHERE shoot_id='demo-preparation' AND kind='template:06-preparation'",
      )
      .get()?.n,
    1,
  );
  assert.equal(
    (
      await api('/api/templates/06-preparation', {
        method: 'POST',
        cookie: admin,
        body: {
          title: '준비물 · 의상',
          body: '{고객명}님 안내',
          active: true,
          condition: '원 전용',
          rules: { stages: [4], packageIds: ['one'], addonIds: [], roles: ['director'] },
        },
      })
    ).status,
    200,
  );
  const filtered = (await (await api(path, { cookie: director })).json()) as {
    data: { templates: unknown[] };
  };
  assert.equal(filtered.data.templates.length, 0);
  const history = (await (await api('/api/settings/history', { cookie: admin })).json()) as {
    data: { items: SettingsHistoryEntryDTO[] };
  };
  assert.equal(history.data.items[0]?.settingKey, 'template:06-preparation');
  assert.equal(history.data.items[0]?.action, 'update');
  assert.equal((await complete()).status, 409);
  db.database.exec("UPDATE shoots SET director_id=NULL WHERE id='demo-preparation'");
  assert.equal((await api(path, { cookie: director })).status, 404);
});

test('public reads preserve catalog, status, calendar and one trailing slash contracts', async () => {
  const { api } = setup();
  const health = await api('/api/health/');
  assert.equal(health.status, 200);
  assert.equal(health.headers.get('Cache-Control'), 'no-store');
  assert.equal(health.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.deepEqual(await health.json(), {
    data: { ok: true, storage: 'd1+r2', demo: true, externalMessages: false },
  });
  const catalog = await api('/api/catalog');
  const catalogData = (await catalog.json()) as {
    data: { packages: { id: string }[]; addons: unknown[] };
  };
  assert.equal(catalog.status, 200);
  assert.ok(catalogData.data.packages.some((item) => item.id === 'one'));
  assert.ok(Array.isArray(catalogData.data.addons));
  const statuses = await api('/api/statuses');
  const statusData = (await statuses.json()) as { data: { statuses: unknown[]; stages: unknown } };
  assert.equal(statuses.status, 200);
  assert.equal(statusData.data.statuses.length, 30);
  assert.ok(statusData.data.stages);
  const calendar = await api('/api/calendar?packageId=one&shopping=true');
  const calendarData = (await calendar.json()) as {
    data: { days: { slots: { time: string; available: boolean }[] }[] };
  };
  assert.equal(calendar.status, 200);
  assert.equal(calendarData.data.days.length, 56);
  assert.equal(calendarData.data.days[0]!.slots[0]!.time, '11:00');
  assert.equal(typeof calendarData.data.days[0]!.slots[0]!.available, 'boolean');
  await expectError(await api('/api/calendar?packageId=missing'), 400, 'INVALID_PACKAGE');
  const demo = await api('/api/demo');
  const demoData = (await demo.json()) as { data: { customers: unknown[] } };
  assert.equal(demo.status, 200);
  assert.equal(demoData.data.customers.length, 4);
  await expectError(await setup('false').api('/api/demo'), 404, 'NOT_FOUND');
});

test('unknown paths and unsupported methods require a session before returning not found', async () => {
  const { api } = setup();
  const admin = await login(api, 'admin');
  for (const [method, path] of [
    ['GET', '/api/missing'],
    ['GET', '/api/missing%0A'],
    ['GET', '/api/missing%0D'],
    ['GET', '/api/missing%E2%80%A8'],
    ['GET', '/api/health//'],
    ['POST', '/api/health'],
    ['HEAD', '/api/health'],
    ['OPTIONS', '/api/shoots'],
    ['DELETE', '/api/shoots/demo-result'],
  ]) {
    assert.equal((await api(path!, { method })).status, 401, `anonymous ${method} ${path}`);
    assert.equal(
      (await api(path!, { method, cookie: admin })).status,
      404,
      `staff ${method} ${path}`,
    );
  }
  assert.equal((await api('/api/shoots/demo-result/', { cookie: admin })).status, 200);
});

test('shoot path parameters decode once and malformed escapes stay private errors', async () => {
  const { api } = setup();
  const cookie = await login(api, 'admin');
  assert.equal((await api('/api/shoots/demo%2Dresult', { cookie })).status, 200);
  await expectError(await api('/api/shoots/demo%252Dresult', { cookie }), 404, 'NOT_FOUND');
  await expectError(await api('/api/shoots/%ZZ', { cookie }), 500, 'INTERNAL_ERROR');
});

test('Origin then session checks run before parsing protected request bodies', async () => {
  const { api, env } = setup();
  const admin = await login(api, 'admin');
  const send = (origin: string, cookie = '') =>
    handleRequest(
      new Request('http://localhost:8787/api/shoots/demo-result/actions', {
        method: 'POST',
        headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' },
        body: '{',
      }),
      env,
    );
  await expectError(await send('https://evil.example'), 403, 'ORIGIN_DENIED');
  await expectError(await send('http://localhost:3002'), 401, 'UNAUTHENTICATED');
  await expectError(await send('http://localhost:3002', admin), 400, 'INVALID_JSON');
});

test('public JSON validation and unexpected failures keep the private error envelope', async (context) => {
  const { env, db, api } = setup();
  const send = (body: string, length?: string) =>
    handleRequest(
      new Request('http://localhost:8787/api/auth/customer', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:3001',
          'Content-Type': 'application/json',
          ...(length ? { 'Content-Length': length } : {}),
        },
        body,
      }),
      env,
    );
  await expectError(await send('{'), 400, 'INVALID_JSON');
  await expectError(await send('[]'), 400, 'INVALID_JSON');
  await expectError(await send('{}'), 400, 'INVALID_INPUT');
  await expectError(await send('{}', String(128 * 1024 + 1)), 413, 'BODY_TOO_LARGE');
  await expectError(
    await send(JSON.stringify({ extra: 'x'.repeat(128 * 1024) })),
    413,
    'BODY_TOO_LARGE',
  );
  await expectError(
    await send(JSON.stringify({ extra: '가'.repeat(50_000) })),
    413,
    'BODY_TOO_LARGE',
  );
  context.mock.method(db, 'prepare', () => {
    throw new Error('private SQL and storage details');
  });
  const logs = context.mock.method(console, 'error', () => {});
  const response = await api('/api/health');
  const error = await expectError(response, 500, 'INTERNAL_ERROR');
  assert.equal(error.message, '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
  assert.ok(!JSON.stringify(error).includes('private SQL'));
  const requestId = response.headers.get('X-Request-Id');
  assert.ok(requestId);
  const diagnostic = String(logs.mock.calls[0]?.arguments[0]);
  assert.deepEqual(JSON.parse(diagnostic), {
    event: 'api_failure',
    requestId,
    method: 'GET',
    status: 500,
    code: 'INTERNAL_ERROR',
  });
});

test('session surface selects the matching cookie and logout clears both sessions', async () => {
  const { api, db } = setup();
  const staffCookie = await login(api, 'staff');
  const customerCookie = await customerLogin(api, 'demo-selection-access', '1003');
  const cookie = `${staffCookie}; ${customerCookie}`;
  const staff = await api('/api/session', { cookie, surface: 'admin' });
  assert.equal(staff.status, 200);
  assert.deepEqual(await staff.json(), {
    data: { actor: { kind: 'staff', id: 'demo-staff', name: '데모 운영 담당', role: 'staff' } },
  });
  const customer = await api('/api/session/', { cookie, surface: 'user' });
  assert.equal(customer.status, 200);
  const customerData = (await customer.json()) as {
    data: { actor: { kind: string; id: string }; shootId: string };
  };
  assert.equal(customerData.data.actor.kind, 'customer');
  assert.equal(customerData.data.actor.id, 'demo-selection');
  assert.equal(customerData.data.shootId, 'demo-selection');
  await expectError(
    await api('/api/session', { cookie: staffCookie, surface: 'user' }),
    401,
    'UNAUTHENTICATED',
  );
  await expectError(
    await api('/api/session', { cookie: customerCookie, surface: 'admin' }),
    401,
    'UNAUTHENTICATED',
  );
  const logout = await api('/api/auth/logout', { method: 'POST', cookie });
  assert.equal(logout.status, 200);
  assert.deepEqual(await logout.json(), { data: { ok: true } });
  const cookies = logout.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.some((value) => value.startsWith('manspick_staff=;')));
  assert.ok(cookies.some((value) => value.startsWith('manspick_customer=;')));
  for (const value of cookies) assert.match(value, /HttpOnly; SameSite=Lax; Max-Age=0/);
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM sessions').get()?.n, 0);
  await expectError(await api('/api/session', { cookie, surface: 'user' }), 401, 'UNAUTHENTICATED');
});

test('notification and settings routes enforce their distinct staff role gates', async () => {
  const { api } = setup();
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  for (const role of ['admin', 'staff', 'director', 'retoucher', 'customer']) {
    const cookie = role === 'customer' ? customer : await login(api, role);
    const notifications = await api('/api/notifications', { cookie });
    if (role === 'admin' || role === 'staff') {
      assert.equal(notifications.status, 200);
      const data = (await notifications.json()) as {
        data: { items: unknown[]; externalMessages: boolean };
      };
      assert.equal(data.data.items.length, 1);
      assert.equal(data.data.externalMessages, false);
    } else {
      await expectError(notifications, 403, 'FORBIDDEN');
    }
    const settings = await api('/api/settings', { cookie });
    if (role === 'admin') {
      assert.equal(settings.status, 200);
      const data = (await settings.json()) as {
        data: { staff: unknown[]; packages: unknown[]; mode: string; externalMessages: boolean };
      };
      assert.ok(data.data.staff.length > 0);
      assert.ok(data.data.packages.length > 0);
      assert.equal(data.data.mode, 'local');
      assert.equal(data.data.externalMessages, false);
    } else {
      await expectError(settings, 403, 'FORBIDDEN');
    }
  }
});

test('upload lists reject missing or foreign shoot scope and mask retoucher file names', async () => {
  const { api } = setup();
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  await expectError(await api('/api/uploads', { cookie: customer }), 400, 'SHOOT_REQUIRED');
  await expectError(
    await api('/api/uploads?shootId=demo-result', { cookie: customer }),
    404,
    'NOT_FOUND',
  );
  const own = await api('/api/uploads?shootId=demo-selection', { cookie: customer });
  assert.equal(own.status, 200);
  const ownData = (await own.json()) as { data: { items: { shootId: string }[] } };
  assert.equal(ownData.data.items.length, 8);
  assert.ok(ownData.data.items.every((item) => item.shootId === 'demo-selection'));
  const retoucher = await login(api, 'retoucher');
  const masked = await api('/api/uploads?shootId=demo-result', { cookie: retoucher });
  assert.equal(masked.status, 200);
  const maskedData = (await masked.json()) as {
    data: { items: { name: string; kind: string; object_key?: string }[] };
  };
  assert.ok(maskedData.data.items.length > 0);
  assert.ok(
    maskedData.data.items.every(
      (item) =>
        item.name === '보정 작업 사진' && item.kind !== 'original' && item.object_key === undefined,
    ),
  );
});

test('retoucher file authorization does not query the database once per asset', async (context) => {
  const { api, db } = setup();
  const cookie = await login(api, 'retoucher');
  const prepare = db.prepare.bind(db);
  const queries = context.mock.method(db, 'prepare', prepare);
  const detail = () => api('/api/shoots/demo-result', { cookie });
  const before = await detail();
  assert.equal(before.status, 200);
  const original = ((await before.json()) as { data: { photos: unknown[] } }).data.photos;
  const queryCount = queries.mock.callCount();
  db.database.exec(`
    WITH RECURSIVE assets(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM assets WHERE n<100)
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by)
    SELECT 'private-probe-'||n,'demo-result','survey','probe/'||n,'private','image/jpeg',1,'demo-result'
    FROM assets;
  `);
  const after = await detail();
  assert.equal(after.status, 200);
  assert.deepEqual(((await after.json()) as { data: { photos: unknown[] } }).data.photos, original);
  assert.equal(queries.mock.callCount() - queryCount, queryCount);
});

test('canonical state count, skip reasons and shopping/all-day slot policy', () => {
  assert.equal(STATUS_DEFINITIONS.length, 30);
  assert.deepEqual(requiredSlots('one', '11:00', true), ['11:00']);
  assert.deepEqual(requiredSlots('hybrid', '13:00', true), ['13:00', '11:00']);
  assert.deepEqual(requiredSlots('allday', '11:00', false), ['11:00', '13:00', '15:00', '17:00']);
  assert.throws(() => assertTransition('payment_pending', 'delivered', 'staff'), /사유/);
  assert.throws(() => assertTransition('preparing', 'delivered', 'director', 'test'), /사유|범위/);
  assert.equal(
    holdExpiry(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T12:00:00Z')),
    '2026-01-01T10:00:00.000Z',
  );
});

test('local login is fail-closed for disabled flag and non-local host', async () => {
  const disabled = setup('false');
  const response = await disabled.api('/api/demo/session', {
    method: 'POST',
    body: { role: 'admin' },
    origin: 'http://localhost:8787',
  });
  assert.equal(response.status, 404);
  const enabled = setup();
  const remote = await enabled.api('/api/demo/session', {
    method: 'POST',
    body: { role: 'admin' },
    hostname: 'example.com',
    origin: 'http://example.com:8787',
  });
  assert.equal(remote.status, 404);
  assert.equal(
    (await enabled.api('/api/demo/session', { method: 'POST', body: { role: 'owner' } })).status,
    400,
  );
});

test('admin test requests can only open active synthetic staff sessions', async () => {
  const { env, db, api } = setup();
  db.database.exec(
    "INSERT INTO staff(id,name,email,role) VALUES('aaa-admin','가상 운영자','other@example.invalid','admin')",
  );
  const host = 'https://admin-test.example.invalid';

  const remoteLogin = (surface: string, adminTest = true, origin = host) =>
    handleRequest(
      new Request(`${host}/api/demo/session`, {
        method: 'POST',
        headers: { Origin: origin, 'X-Manspick-Surface': surface },
        body: JSON.stringify({ role: 'admin' }),
      }),
      { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: adminTest },
    );

  const local = await api('/api/demo/session', { method: 'POST', body: { role: 'admin' } });
  assert.equal(local.status, 200);
  assert.equal(((await local.json()) as { data: SessionDTO }).data.actor.id, 'aaa-admin');
  await expectError(await remoteLogin('admin', false), 404, 'NOT_FOUND');
  await expectError(await remoteLogin('user'), 404, 'NOT_FOUND');
  await expectError(
    await remoteLogin('admin', true, 'https://other.invalid'),
    403,
    'ORIGIN_DENIED',
  );

  const loginResponse = await remoteLogin('admin');
  assert.equal(loginResponse.status, 200);
  const cookie = loginResponse.headers.get('Set-Cookie') ?? '';
  assert.match(cookie, /^manspick_staff=[a-f0-9]{64}; Path=\/; HttpOnly; SameSite=Lax; Secure$/);
  const { data } = (await loginResponse.json()) as { data: SessionDTO };
  assert.equal(data.actor.id, 'demo-admin');
  assert.equal(data.actor.role, 'admin');
  const session = await handleRequest(
    new Request(`${host}/api/session`, {
      headers: { Cookie: cookie.split(';')[0]!, 'X-Manspick-Surface': 'admin' },
    }),
    { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: true },
  );
  assert.equal(session.status, 200);
  assert.equal(((await session.json()) as { data: SessionDTO }).data.actor.id, 'demo-admin');
  db.database.exec("UPDATE staff SET active=0 WHERE id='demo-admin'");
  await expectError(await remoteLogin('admin'), 403, 'FORBIDDEN');
});

test('the private test Worker accepts the admin proxy without a browser password', async () => {
  const { env } = setup('false');
  const origin = 'https://admin-test.example.invalid';
  const request = (surface: string) =>
    new Request(`${origin}/api/demo/session`, {
      method: 'POST',
      headers: { Origin: origin, 'X-Manspick-Surface': surface },
      body: JSON.stringify({ role: 'admin' }),
    });

  const response = await testWorker.fetch(request('admin'), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('WWW-Authenticate'), null);
  assert.equal(((await response.json()) as { data: SessionDTO }).data.actor.id, 'demo-admin');
  assert.equal((await testWorker.fetch(request('user'), env)).status, 404);
});

test('admin test fixture images require a staff session and preserve normal file access', async () => {
  const { env, api } = setup();
  const staff = await login(api, 'admin');
  const customer = await customerLogin(api, 'demo-selection-access', '1003');
  const photo = '/api/uploads/demo-selection-upload-1/blob';

  const remotePhoto = (surface: string, cookie: string, adminTest = true) =>
    handleRequest(
      new Request(`https://admin-test.example.invalid${photo}`, {
        headers: { 'X-Manspick-Surface': surface, Cookie: cookie },
      }),
      { ...env, LOCAL_DEMO: 'false', ADMIN_TEST: adminTest },
    );

  const local = await api(photo, { cookie: customer, surface: 'user' });
  assert.equal(local.status, 200);
  assert.equal(local.headers.get('Content-Type'), 'image/svg+xml');
  await expectError(await remotePhoto('admin', ''), 401, 'UNAUTHENTICATED');
  await expectError(await remotePhoto('admin', staff, false), 404, 'FILE_MISSING');
  await expectError(await remotePhoto('user', customer), 404, 'FILE_MISSING');
  const testImage = await remotePhoto('admin', staff);
  assert.equal(testImage.status, 200);
  assert.equal(testImage.headers.get('Content-Type'), 'image/svg+xml');
  assert.equal(testImage.headers.get('Cache-Control'), 'private, no-store');
  assert.match(await testImage.text(), /<svg/);
});

test('customer verification scope, hashed browser sessions, five-failure lock and CSRF', async () => {
  const { api, db } = setup();
  const cookie = await customerLogin(api, 'demo-selection-access', '1003');
  assert.equal((await api('/api/shoots/demo-result', { cookie, surface: 'user' })).status, 404);
  assert.equal((await api('/api/shoots/demo-selection', { cookie, surface: 'user' })).status, 200);
  const stored = db.database.prepare('SELECT token_hash FROM sessions').get()?.token_hash;
  assert.equal(typeof stored, 'string');
  assert.equal(String(stored).length, 64);
  assert.ok(!cookie.includes(String(stored)));
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await api('/api/auth/customer', {
          method: 'POST',
          body: { token: 'demo-payment-access', last4: '0000' },
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await api('/api/auth/customer', {
        method: 'POST',
        body: { token: 'demo-payment-access', last4: '1001' },
      })
    ).status,
    429,
  );
  const denied = await api('/api/shoots/demo-selection/actions', {
    method: 'POST',
    cookie,
    body: { type: 'submit_selection', photoIds: ['demo-selection-photo-1'] },
    origin: 'https://evil.example',
  });
  assert.equal(denied.status, 403);
});

test('retoucher DTO excludes identity, phone, internal notes and unrelated photographs', async () => {
  const { api } = setup();
  const cookie = await login(api, 'retoucher');
  const response = await api('/api/shoots/demo-result', { cookie, surface: 'admin' });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(!body.includes('01000001004'));
  assert.ok(!body.includes('데모 고객 · 결과'));
  const data = JSON.parse(body).data;
  assert.deepEqual(data.notes, []);
  assert.deepEqual(data.payments, []);
  assert.deepEqual(data.survey.answers, { retouchStrength: 50 });
  assert.equal(
    (await api('/api/shoots/demo-preparation', { cookie, surface: 'admin' })).status,
    404,
  );
  assert.equal((await api('/api/settings', { cookie, surface: 'admin' })).status, 403);
});

test('concurrent booking uses unique slots and atomic rollback (one winner)', async () => {
  const { api, db } = setup();
  const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const body = {
    name: '로컬 동시 예약',
    phone: '01000002001',
    packageId: 'one',
    addons: [],
    date,
    time: '11:00',
    paymentChannel: 'bank',
    privacyConsent: true,
    serviceNotificationConsent: true,
  };
  const responses = await Promise.all([
    api('/api/start', { method: 'POST', body }),
    api('/api/start', { method: 'POST', body: { ...body, phone: '01000002002' } }),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  assert.equal(
    db.database
      .prepare('SELECT COUNT(*) AS n FROM slots WHERE date=? AND time=?')
      .get(date, '11:00')?.n,
    1,
  );
  assert.equal(
    db.database.prepare("SELECT COUNT(*) AS n FROM customers WHERE phone LIKE '0100000200%'").get()
      ?.n,
    1,
  );
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM mutation_guards').get()?.n, 0);
});

function bookingInput(date: string, time: string, phone: string) {
  return {
    name: '일정 예약 테스트',
    phone,
    packageId: 'one',
    addons: [] as { id: string; quantity: number }[],
    date,
    time,
    privacyConsent: true,
    serviceNotificationConsent: true,
  };
}

function futureBookingDate(days = 14) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

async function bookingResponse(response: Response) {
  return (
    (await response.json()) as {
      data: { localAccess?: { shootId: string; token: string; last4: string } };
    }
  ).data;
}

async function bookingCalendarDay(response: Response, date: string) {
  const { data } = (await response.json()) as {
    data: { days: { date: string; slots: { time: string; available: boolean }[] }[] };
  };
  const day = data.days.find((item) => item.date === date);
  assert.ok(day);
  return day;
}

test('booking uses saved intervals and allows an adjacent appointment at the exact end', async () => {
  const { api, db } = setup();
  const date = futureBookingDate();
  db.database.prepare("UPDATE packages SET duration=240 WHERE id='one'").run();
  assert.equal(
    (await api('/api/start', { method: 'POST', body: bookingInput(date, '11:00', '01000002400') }))
      .status,
    201,
  );
  db.database.prepare("UPDATE packages SET duration=90 WHERE id='one'").run();
  const response = await api('/api/calendar?packageId=one');
  const day = await bookingCalendarDay(response, date);
  assert.deepEqual(day.slots, [
    { time: '11:00', available: false },
    { time: '13:00', available: false },
    { time: '15:00', available: true },
    { time: '17:00', available: true },
  ]);
  const staff = await login(api, 'staff');
  const schedule = await api(`/api/schedule?week=${date}`, { cookie: staff });
  const { data: scheduleData } = (await schedule.json()) as { data: ScheduleDTO };
  assert.deepEqual(
    scheduleData.slots.filter((slot) => slot.date === date).map((slot) => slot.state),
    ['held', 'held', 'available', 'available'],
  );
  assert.equal(
    (await api('/api/start', { method: 'POST', body: bookingInput(date, '13:00', '01000002401') }))
      .status,
    409,
  );
  assert.equal(
    (await api('/api/start', { method: 'POST', body: bookingInput(date, '15:00', '01000002402') }))
      .status,
    201,
  );
});

test('booking cannot commit when a director holiday wins the race', async () => {
  const { api, db } = setup();
  const date = futureBookingDate();
  const admin = await login(api, 'admin');
  const originalBatch = db.batch.bind(db);
  db.batch = async (statements) => {
    if (statements.some((item) => item.sql.includes('INSERT INTO customers'))) {
      db.batch = originalBatch;
      const holiday = await api('/api/settings', {
        method: 'POST',
        cookie: admin,
        body: { type: 'day_off', directorId: 'demo-director', date, unavailable: true },
      });
      assert.equal(holiday.status, 200);
    }
    return originalBatch(statements);
  };
  const result = await api('/api/start', {
    method: 'POST',
    body: bookingInput(date, '11:00', '01000002410'),
  });
  assert.equal(result.status, 409);
  assert.equal(db.database.prepare('SELECT COUNT(*) AS n FROM slots WHERE date=?').get(date)?.n, 0);
});

test('reassignment checks saved intervals and uses the same add-on eligibility as booking', async () => {
  const { api, db } = setup();
  const date = futureBookingDate();
  const admin = await login(api, 'admin');
  const staff = await login(api, 'staff');
  const settings = (
    (await (await api('/api/settings', { cookie: admin })).json()) as {
      data: OperationsSettingsDTO;
    }
  ).data;
  const hair = settings.addons.find((addon) => addon.id === 'hair');
  assert.ok(hair);
  assert.equal(
    (
      await api('/api/settings', {
        method: 'POST',
        cookie: admin,
        body: { type: 'addon', value: { ...hair, requiresDirector: false } },
      })
    ).status,
    200,
  );
  db.database.prepare("UPDATE packages SET duration=240 WHERE id='one'").run();
  const create = (time: string, phone: string, addons = [] as { id: string; quantity: number }[]) =>
    api('/api/start', { method: 'POST', body: { ...bookingInput(date, time, phone), addons } });
  const firstBooking = await create('11:00', '01000002430', [{ id: 'hair', quantity: 1 }]);
  assert.equal(firstBooking.status, 201, await firstBooking.clone().text());
  const firstAccess = (await bookingResponse(firstBooking)).localAccess;
  assert.ok(firstAccess);
  const firstId = firstAccess.shootId;
  db.database
    .prepare(
      "INSERT INTO staff(id,name,email,role) VALUES('director-two','디렉터 2','two@example.test','director')",
    )
    .run();
  db.database.prepare("UPDATE packages SET duration=90 WHERE id='one'").run();
  const secondBooking = await create('13:00', '01000002431');
  assert.equal(secondBooking.status, 201, await secondBooking.clone().text());
  const secondAccess = (await bookingResponse(secondBooking)).localAccess;
  assert.ok(secondAccess);
  const secondId = secondAccess.shootId;
  const assign = (shootId: string, directorId: string) =>
    api(`/api/shoots/${shootId}/actions`, {
      method: 'POST',
      cookie: staff,
      body: { type: 'assign_staff', directorId, reason: '담당 배정 검사' },
    });
  assert.equal((await assign(secondId, 'demo-director')).status, 409);
  assert.equal((await assign(firstId, 'director-two')).status, 409);
  assert.equal(
    (
      await api(`/api/shoots/${secondId}/actions`, {
        method: 'POST',
        cookie: staff,
        body: { type: 'cancel', reason: '시간 해제' },
      })
    ).status,
    200,
  );
  assert.equal((await assign(firstId, 'director-two')).status, 200);
  assert.equal(
    db.database.prepare('SELECT director_id FROM slots WHERE shoot_id=?').get(firstId)?.director_id,
    'director-two',
  );
});

test('a booking that spans midnight conflicts with a holiday on the next date', async () => {
  const { api, db } = setup();
  const date = futureBookingDate();
  const nextDate = futureBookingDate(15);
  const admin = await login(api, 'admin');
  const holiday = (unavailable: boolean) =>
    api('/api/settings', {
      method: 'POST',
      cookie: admin,
      body: { type: 'day_off', directorId: 'demo-director', date: nextDate, unavailable },
    });
  const book = () =>
    api('/api/start', {
      method: 'POST',
      body: bookingInput(date, '17:00', '01000002440'),
    });
  db.database.prepare("UPDATE packages SET duration=1440 WHERE id='one'").run();
  assert.equal((await holiday(true)).status, 200);
  assert.equal((await book()).status, 409);
  assert.equal((await holiday(false)).status, 200);
  assert.equal((await book()).status, 201);
  assert.equal((await holiday(true)).status, 409);
  const availability = await api('/api/calendar?packageId=one');
  const next = await bookingCalendarDay(availability, nextDate);
  assert.deepEqual(
    next.slots.map((slot) => slot.available),
    [false, false, false, true],
  );
});

test('booking reclaims expired holds and keeps the old and new access scopes separate', async () => {
  const { api, db } = setup();
  const body = bookingInput(futureBookingDate(), '11:00', '01000002420');
  const create = () => api('/api/start', { method: 'POST', body });
  const initial = (await bookingResponse(await create())).localAccess;
  assert.ok(initial);
  const duplicate = await bookingResponse(await create());
  assert.equal(duplicate.localAccess, undefined);
  db.database
    .prepare("UPDATE payments SET held_until='2000-01-01T00:00:00.000Z' WHERE shoot_id=?")
    .run(initial.shootId);
  const calendarResponse = await api('/api/calendar?packageId=one');
  const day = await bookingCalendarDay(calendarResponse, body.date);
  assert.equal(day.slots[0].available, true);
  const replacement = await create();
  assert.equal(replacement.status, 201, await replacement.clone().text());
  const next = (await bookingResponse(replacement)).localAccess;
  assert.ok(next);
  assert.notEqual(next.shootId, initial.shootId);
  assert.notEqual(next.token, initial.token);
  assert.equal(
    db.database.prepare('SELECT status FROM shoots WHERE id=?').get(initial.shootId)?.status,
    'cancelled',
  );
  assert.equal(
    db.database.prepare('SELECT state FROM payments WHERE shoot_id=?').get(initial.shootId)?.state,
    'released',
  );
  assert.equal(
    db.database.prepare('SELECT state FROM notifications WHERE shoot_id=?').get(initial.shootId)
      ?.state,
    'cancelled',
  );
  assert.equal(
    db.database.prepare('SELECT shoot_id FROM slots WHERE date=?').get(body.date)?.shoot_id,
    next.shootId,
  );
  const oldCookie = await customerLogin(api, initial.token, initial.last4);
  assert.equal(
    (await api(`/api/shoots/${next.shootId}`, { cookie: oldCookie, surface: 'user' })).status,
    404,
  );
});

test('production booking does not reveal active numbers through capacity checks or success bodies', async () => {
  const { api, db } = setup('false');
  const date = futureBookingDate();
  const activePhone = '01000002450';
  const newPhone = '01000002451';
  const create = (time: string, phone: string) =>
    api('/api/start', {
      method: 'POST',
      origin: 'http://localhost:8787',
      body: bookingInput(date, time, phone),
    });
  const initial = await create('11:00', activePhone);
  assert.equal(initial.status, 201);
  const accepted = await initial.json();
  assert.deepEqual(accepted, {
    data: {
      accepted: true,
      message: '접수 요청이 처리되었습니다. 등록한 번호로 운영팀의 안내를 확인해주세요.',
    },
  });
  assert.equal((await create('11:00', activePhone)).status, 409);
  assert.equal((await create('11:00', newPhone)).status, 409);
  const duplicate = await create('13:00', activePhone);
  assert.equal(duplicate.status, 201);
  assert.deepEqual(await duplicate.json(), accepted);
  const second = await create('13:00', newPhone);
  assert.equal(second.status, 201);
  assert.deepEqual(await second.json(), accepted);
  const notification = db.database
    .prepare(
      `SELECT n.body FROM notifications n JOIN shoots s ON s.id=n.shoot_id
    JOIN customers c ON c.id=s.customer_id WHERE c.phone=? AND n.kind='booking'`,
    )
    .get(activePhone);
  assert.equal(
    notification?.body,
    '신규 접수: 고객용 접속 링크를 발급해 등록한 번호로 직접 안내해주세요.',
  );
});

test('selection rejects foreign photo, checks candidates once, and prevents duplicate submission', async (context) => {
  const { api, db } = setup();
  const cookie = await customerLogin(api, 'demo-selection-access', '1003');
  const bad = await api('/api/shoots/demo-selection/actions', {
    method: 'POST',
    cookie,
    surface: 'user',
    body: { type: 'submit_selection', photoIds: ['demo-result-photo-1'] },
  });
  assert.equal(bad.status, 400);
  const queries = context.mock.method(db, 'prepare', db.prepare.bind(db));
  const payload = {
    type: 'submit_selection',
    photoIds: ['demo-selection-photo-2', 'demo-selection-photo-1'],
  };
  const result = await api('/api/shoots/demo-selection/actions', {
    method: 'POST',
    cookie,
    surface: 'user',
    body: payload,
  });
  assert.equal(result.status, 200, await result.text());
  assert.equal(
    queries.mock.calls.filter(({ arguments: [sql] }) =>
      /FROM photos WHERE.*kind='candidate'/s.test(sql),
    ).length,
    1,
  );
  assert.equal(
    db.database.prepare("SELECT picks_json FROM selections WHERE shoot_id='demo-selection'").get()
      ?.picks_json,
    JSON.stringify(payload.photoIds),
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
      .get()?.n,
    1,
  );
  assert.equal(
    (
      await api('/api/shoots/demo-selection/actions', {
        method: 'POST',
        cookie,
        surface: 'user',
        body: payload,
      })
    ).status,
    409,
  );
});

test('extra selection validates up to 100 eligible candidates in one query', async (context) => {
  const { api, db } = setup();
  const cookie = await customerLogin(api, 'demo-result-access', '1004');
  db.database.exec(`
    WITH RECURSIVE cuts(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM cuts WHERE n<100)
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,visible,uploaded_by)
    SELECT 'extra-upload-'||n,'demo-result','candidate','extra/'||n,'후보 사진','image/jpeg',1,1,'demo-director'
    FROM cuts;
    WITH RECURSIVE cuts(n) AS (VALUES(1) UNION ALL SELECT n+1 FROM cuts WHERE n<100)
    INSERT INTO photos(id,shoot_id,upload_id,kind,cut_no,visible,uploaded_by)
    SELECT 'extra-photo-'||n,'demo-result','extra-upload-'||n,'candidate',n+3,1,'demo-director'
    FROM cuts;
  `);
  const photoIds = Array.from({ length: 100 }, (_, index) => `extra-photo-${100 - index}`);
  const request = (ids: string[]) =>
    api('/api/shoots/demo-result/actions', {
      method: 'POST',
      cookie,
      surface: 'user',
      body: { type: 'request_extra_retouch', photoIds: ids },
    });
  await expectError(await request([...photoIds, 'extra-photo-101']), 400, 'SELECTION_COUNT');
  await expectError(await request([photoIds[0], photoIds[0]]), 400, 'SELECTION_COUNT');
  for (const ineligible of [
    'demo-selection-photo-1',
    'demo-result-candidate-photo-1',
    'demo-result-photo-1',
  ])
    await expectError(await request([photoIds[0], ineligible]), 400, 'INVALID_PHOTO');
  db.database.exec("UPDATE photos SET visible=0 WHERE id='extra-photo-1'");
  await expectError(await request(photoIds), 400, 'INVALID_PHOTO');
  db.database.exec("UPDATE photos SET visible=1 WHERE id='extra-photo-1'");

  const queries = context.mock.method(db, 'prepare', db.prepare.bind(db));
  const result = await request(photoIds);
  assert.equal(result.status, 200, await result.text());
  assert.equal(
    queries.mock.calls.filter(({ arguments: [sql] }) =>
      /FROM photos WHERE.*kind='candidate'/s.test(sql),
    ).length,
    1,
  );
  assert.equal(
    db.database
      .prepare("SELECT picks_json FROM selections WHERE shoot_id='demo-result' AND round='extra'")
      .get()?.picks_json,
    JSON.stringify(photoIds),
  );
  await expectError(await request(photoIds), 409, 'EXTRA_ALREADY_SELECTED');
});

test('revision cap is a DB invariant and request/photo ownership is enforced', () => {
  const { db } = setup();
  for (let i = 1; i <= 3; i++)
    db.database
      .prepare(
        "INSERT INTO requests(id,shoot_id,type,state) VALUES(?,'demo-result','revision','complete')",
      )
      .run(`revision-${i}`);
  assert.throws(
    () =>
      db.database
        .prepare(
          "INSERT INTO requests(id,shoot_id,type,state) VALUES('revision-4','demo-result','revision','new')",
        )
        .run(),
    /REVISION_LIMIT/,
  );
  assert.throws(
    () =>
      db.database
        .prepare(
          "INSERT INTO request_items(id,request_id,photo_id,comment) VALUES('bad-item','revision-1','demo-selection-photo-1','test')",
        )
        .run(),
    /PHOTO_SCOPE/,
  );
});

test('payment confirmation and expired hold fail closed; cancellation frees resources', async () => {
  const { api, db } = setup();
  const cookie = await login(api, 'staff');
  const customer = await customerLogin(api, 'demo-payment-access', '1001');
  assert.equal(
    (
      await api('/api/shoots/demo-payment/actions', {
        method: 'POST',
        cookie: customer,
        surface: 'user',
        body: { type: 'confirm_payment', paymentId: 'demo-payment-base' },
      })
    ).status,
    403,
  );
  db.database
    .prepare(
      "UPDATE payments SET held_until='2000-01-01T00:00:00.000Z' WHERE id='demo-payment-base'",
    )
    .run();
  assert.equal(
    (
      await api('/api/shoots/demo-payment/actions', {
        method: 'POST',
        cookie,
        body: { type: 'confirm_payment', paymentId: 'demo-payment-base' },
      })
    ).status,
    409,
  );
  const result = await api('/api/shoots/demo-payment/actions', {
    method: 'POST',
    cookie,
    body: { type: 'cancel', reason: '로컬 취소 테스트' },
  });
  assert.equal(result.status, 200);
  assert.equal(
    db.database.prepare("SELECT COUNT(*) AS n FROM slots WHERE shoot_id='demo-payment'").get()?.n,
    0,
  );
  assert.equal(
    db.database.prepare("SELECT state FROM notifications WHERE id='demo-outbox'").get()?.state,
    'cancelled',
  );
});

test('private original gate, authorized upload persists R2, and hostile upload is rejected', async () => {
  const { api, db, env, objects } = setup();
  const cookie = await customerLogin(api, 'demo-result-access', '1004');
  assert.equal(
    (await api('/api/uploads/demo-original-upload-1/blob', { cookie, surface: 'user' })).status,
    404,
  );
  const form = new FormData();
  form.set('shootId', 'demo-result');
  form.set('kind', 'review');
  form.set(
    'file',
    new File([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0])], 'local.jpg', {
      type: 'image/jpeg',
    }),
  );
  const response = await handleRequest(
    new Request('http://localhost:8787/api/uploads', {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'http://localhost:3001', 'X-Manspick-Surface': 'user' },
      body: form,
    }),
    env,
  );
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal(objects.size, 1);
  const upload = ((await response.json()) as { data: { id: string } }).data;
  assert.equal(
    (await api(`/api/uploads/${upload.id}/blob`, { cookie, surface: 'user' })).status,
    200,
  );
  const hostile = new FormData();
  hostile.set('shootId', 'demo-result');
  hostile.set('kind', 'review');
  hostile.set('file', new File(['<script>bad</script>'], 'bad.jpg', { type: 'image/jpeg' }));
  assert.equal(
    (
      await handleRequest(
        new Request('http://localhost:8787/api/uploads', {
          method: 'POST',
          headers: {
            Cookie: cookie,
            Origin: 'http://localhost:3001',
            'X-Manspick-Surface': 'user',
          },
          body: hostile,
        }),
        env,
      )
    ).status,
    400,
  );

  const staff = await login(api, 'staff');
  form.set('kind', 'original');
  const original = await handleRequest(
    new Request('http://localhost:8787/api/uploads', {
      method: 'POST',
      headers: { Cookie: staff, Origin: 'http://localhost:3002', 'X-Manspick-Surface': 'admin' },
      body: form,
    }),
    env,
  );
  assert.equal(original.status, 201);
  const { data } = (await original.json()) as { data: { id: string; url: string } };
  assert.equal((await api(data.url, { cookie, surface: 'user' })).status, 404);
  assert.equal((await api(data.url, { cookie: staff, surface: 'admin' })).status, 200);
  assert.equal(
    db.database.prepare('SELECT COUNT(*) AS n FROM file_links WHERE upload_id=?').get(data.id)?.n,
    0,
  );
});

test('payment, survey and plan preserve independent customer progress', async () => {
  const { api, db } = setup();
  const staff = await login(api, 'staff');
  const director = await login(api, 'director');
  db.database
    .prepare("UPDATE shoots SET survey_due_at=? WHERE id='demo-payment'")
    .run(new Date(Date.now() + 86400000).toISOString());
  const customer = await customerLogin(api, 'demo-payment-access', '1001');
  const action = (body: unknown, cookie = customer) =>
    api('/api/shoots/demo-payment/actions', { method: 'POST', cookie, body });
  assert.equal((await action({ type: 'request_deposit', depositor: '로컬 입금자' })).status, 200);
  assert.equal(
    db.database.prepare("SELECT state FROM payments WHERE id='demo-payment-base'").get()?.state,
    'pending',
  );
  assert.equal(
    (await action({ type: 'confirm_payment', paymentId: 'demo-payment-base' }, staff)).status,
    200,
  );
  const answers = {
    firstImpression: 3,
    age: 30,
    style: '캐주얼',
    motivation: '새 프로필',
    retouchStrength: 0,
    selector: 'customer',
    safetyRead: true,
  };
  assert.equal(
    (await action({ type: 'save_survey', answers, pageDone: [1, 2, 3, 4], submit: true })).status,
    400,
  );
  db.database
    .prepare(
      "INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by) VALUES('survey-proof','demo-payment','survey','demo/survey','가상 얼굴 사진','image/jpeg',1,'demo-payment')",
    )
    .run();
  assert.equal(
    (await action({ type: 'save_survey', answers, pageDone: [1, 2, 3, 4], submit: true })).status,
    200,
  );
  assert.equal(
    (
      await action(
        { type: 'share_plan', concept: '로컬 콘셉트', outfits: '가상 착장', note: '' },
        director,
      )
    ).status,
    200,
  );
  assert.equal(
    (await action({ type: 'save_survey', answers, pageDone: [1, 2, 3, 4], submit: true })).status,
    200,
  );
  assert.equal(
    db.database.prepare("SELECT status FROM shoots WHERE id='demo-payment'").get()?.status,
    'preparing',
  );
  assert.equal(
    (await action({ type: 'save_survey', answers: {}, pageDone: [1, 2, 3, 4], submit: true }))
      .status,
    400,
  );
});

test('new revision requires its own result and review approval opens originals once', async () => {
  const { api, env, db } = setup();
  const customer = await customerLogin(api, 'demo-result-access', '1004');
  const retoucher = await login(api, 'retoucher');
  const staff = await login(api, 'staff');
  const action = (body: unknown, cookie = customer) =>
    api('/api/shoots/demo-result/actions', { method: 'POST', cookie, body });
  assert.equal(
    (
      await action({
        type: 'request_revision',
        items: [{ photoId: 'demo-result-photo-1', comment: '가상 수정 의견' }],
      })
    ).status,
    200,
  );
  assert.equal((await action({ type: 'finish_retouch' }, retoucher)).status, 400);
  const form = new FormData();
  form.set('shootId', 'demo-result');
  form.set('kind', 'revision');
  form.set(
    'file',
    new File([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0])], 'revision.jpg', {
      type: 'image/jpeg',
    }),
  );
  assert.equal(
    (
      await handleRequest(
        new Request('http://localhost:8787/api/uploads', {
          method: 'POST',
          headers: { Cookie: retoucher, Origin: 'http://localhost:3002' },
          body: form,
        }),
        env,
      )
    ).status,
    201,
  );
  assert.equal((await action({ type: 'finish_retouch' }, retoucher)).status, 200);
  db.database
    .prepare(
      "INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by) VALUES('review-proof','demo-result','review','demo/review','가상 후기','image/jpeg',1,'demo-result')",
    )
    .run();
  assert.equal((await action({ type: 'review_submit', uploadId: 'review-proof' })).status, 200);
  const requestId = db.database
    .prepare("SELECT id FROM requests WHERE shoot_id='demo-result' AND type='review'")
    .get()?.id;
  assert.equal(
    (await action({ type: 'resolve_request', requestId, decision: 'complete' }, staff)).status,
    200,
  );
  assert.equal(
    (await api('/api/uploads/demo-original-upload-1/blob', { cookie: customer })).status,
    200,
  );
  assert.equal(
    (await action({ type: 'resolve_request', requestId, decision: 'complete' }, staff)).status,
    409,
  );
  assert.equal((await action({ type: 'review_submit', uploadId: 'review-proof' })).status, 409);
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM campaign_claims WHERE shoot_id='demo-result'")
      .get()?.n,
    1,
  );
});

test('a historical retoucher cannot read, upload or complete another retoucher job', async () => {
  const { api, env, db } = setup();
  const cookie = await login(api, 'retoucher');
  db.database.exec(`
    INSERT INTO staff(id,name,email,role) VALUES('other-retoucher','다른 가상 보정가','other-demo@manspick.example','retoucher');
    INSERT INTO requests(id,shoot_id,type,message) VALUES('other-request','demo-result','revision','다른 담당자 작업 의견');
    INSERT INTO retouch_jobs(id,shoot_id,retoucher_id,kind,request_id) VALUES('other-job','demo-result','other-retoucher','revision','other-request');
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by,retouch_job_id) VALUES('other-upload','demo-result','revision','demo/other-result','다른 담당자 결과','image/jpeg',1,'other-retoucher','other-job');
    INSERT INTO photos(id,shoot_id,upload_id,kind,cut_no,uploaded_by) VALUES('other-photo','demo-result','other-upload','revision',1,'other-retoucher');
    UPDATE shoots SET status='retouching',retoucher_id='other-retoucher' WHERE id='demo-result';
  `);
  const response = await api('/api/shoots/demo-result', { cookie });
  assert.equal(response.status, 200);
  const detail = (
    (await response.json()) as { data: { photos: { id: string }[]; requests: { id: string }[] } }
  ).data;
  assert.ok(!detail.photos.some((photo) => photo.id === 'other-photo'));
  assert.ok(!detail.requests.some((request) => request.id === 'other-request'));
  assert.equal((await api('/api/uploads/other-upload/blob', { cookie })).status, 404);
  const form = new FormData();
  form.set('shootId', 'demo-result');
  form.set('kind', 'revision');
  form.set(
    'file',
    new File([new Uint8Array([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0])], 'other.jpg', {
      type: 'image/jpeg',
    }),
  );
  assert.equal(
    (
      await handleRequest(
        new Request('http://localhost:8787/api/uploads', {
          method: 'POST',
          headers: { Cookie: cookie, Origin: 'http://localhost:3002' },
          body: form,
        }),
        env,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api('/api/shoots/demo-result/actions', {
        method: 'POST',
        cookie,
        body: { type: 'finish_retouch' },
      })
    ).status,
    409,
  );
  assert.equal(
    db.database.prepare("SELECT state FROM retouch_jobs WHERE id='other-job'").get()?.state,
    'pending',
  );
  assert.equal(
    db.database.prepare("SELECT visible FROM uploads WHERE id='other-upload'").get()?.visible,
    0,
  );
  db.database.exec(`
    INSERT INTO retouch_jobs(id,shoot_id,retoucher_id,kind) VALUES('own-job','demo-result','demo-retoucher','base');
    INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,uploaded_by,retouch_job_id) VALUES('own-upload','demo-result','retouched','demo/own-result','본인 결과','image/jpeg',1,'demo-retoucher','own-job');
    INSERT INTO photos(id,shoot_id,upload_id,kind,cut_no,uploaded_by) VALUES('own-photo','demo-result','own-upload','retouched',4,'demo-retoucher');
    INSERT INTO photo_metadata(photo_id,parent_photo_id) VALUES('own-photo','demo-result-candidate-photo-1');
  `);
  const finish = () =>
    api('/api/shoots/demo-result/actions', {
      method: 'POST',
      cookie,
      body: { type: 'finish_retouch' },
    });
  await expectError(await finish(), 400, 'RESULT_REQUIRED');
  async function uploadCut(cut: string, key = crypto.randomUUID()) {
    const form = new FormData();
    form.set('shootId', 'demo-result');
    form.set('kind', 'retouched');
    form.set('retouchJobId', 'own-job');
    form.set('parentPhotoId', cut);
    form.set('file', new File([new Uint8Array([255, 216, 255])], '컷.jpg', { type: 'image/jpeg' }));
    return handleRequest(
      new Request('http://localhost:8787/api/uploads', {
        method: 'POST',
        headers: { Cookie: cookie, Origin: 'http://localhost:3002', 'Idempotency-Key': key },
        body: form,
      }),
      env,
    );
  }
  await expectError(await uploadCut('demo-result-photo-1'), 400, 'RESULT_CUT_REQUIRED');
  const key = crypto.randomUUID();
  const cutTwo = 'demo-result-candidate-photo-2';
  const first = await uploadCut(cutTwo, key);
  assert.equal(first.status, 201);
  const uploaded = ((await first.json()) as { data: { id: string } }).data.id;
  const repeated = await uploadCut(cutTwo, key);
  assert.equal(repeated.status, 201);
  assert.equal(((await repeated.json()) as { data: { id: string } }).data.id, uploaded);
  await expectError(
    await uploadCut('demo-result-candidate-photo-3', key),
    409,
    'UPLOAD_KEY_REUSED',
  );
  // Even a legitimate replacement for the same cut does not fulfill the next cut.
  assert.equal((await uploadCut(cutTwo)).status, 201);
  await expectError(await finish(), 400, 'RESULT_REQUIRED');
  assert.equal((await uploadCut('demo-result-candidate-photo-3')).status, 201);
  assert.equal(
    (
      await api('/api/shoots/demo-result/actions', {
        method: 'POST',
        cookie,
        body: { type: 'finish_retouch' },
      })
    ).status,
    200,
  );
  assert.equal(
    db.database.prepare("SELECT state FROM retouch_jobs WHERE id='own-job'").get()?.state,
    'complete',
  );
  assert.equal(
    db.database.prepare("SELECT visible FROM uploads WHERE id='own-upload'").get()?.visible,
    1,
  );
  assert.equal(
    db.database.prepare('SELECT visible FROM uploads WHERE id=?').get(uploaded)?.visible,
    0,
  );
  assert.equal(
    db.database
      .prepare("SELECT count(*) AS n FROM uploads WHERE retouch_job_id='own-job' AND visible=1")
      .get()?.n,
    3,
  );
  assert.equal(
    db.database.prepare("SELECT state FROM retouch_jobs WHERE id='other-job'").get()?.state,
    'pending',
  );
  assert.equal(
    db.database.prepare("SELECT visible FROM uploads WHERE id='other-upload'").get()?.visible,
    0,
  );
  assert.equal(
    db.database.prepare("SELECT status FROM shoots WHERE id='demo-result'").get()?.status,
    'retouching',
  );
});

test('new retouch jobs require a current active retoucher', async (t) => {
  await t.test('included selection rejects an inactive assignee', async () => {
    const { api, db } = setup();
    const cookie = await customerLogin(api, 'demo-selection-access', '1003');
    db.database.exec("UPDATE staff SET active=0 WHERE id='demo-retoucher'");
    await expectError(
      await api('/api/shoots/demo-selection/actions', {
        method: 'POST',
        cookie,
        body: { type: 'submit_selection', photoIds: ['demo-selection-photo-1'] },
      }),
      409,
      'RETOUCHER_REQUIRED',
    );
    assert.equal(
      db.database.prepare("SELECT id FROM selections WHERE shoot_id='demo-selection'").get(),
      undefined,
    );
  });

  await t.test(
    'extra payment checks the current role and preserves confirmed retries',
    async () => {
      const { api, db } = setup();
      const customer = await customerLogin(api, 'demo-selection-access', '1003');
      const staff = await login(api, 'staff');
      const action = (cookie: string, body: unknown) =>
        api('/api/shoots/demo-selection/actions', { method: 'POST', cookie, body });
      const photoIds = Array.from({ length: 8 }, (_, i) => `demo-selection-photo-${i + 1}`);
      assert.equal((await action(customer, { type: 'submit_selection', photoIds })).status, 200);
      const paymentId = db.database
        .prepare(
          "SELECT id FROM payments WHERE shoot_id='demo-selection' AND kind='selection_extra'",
        )
        .get()?.id;
      const confirm = () => action(staff, { type: 'confirm_payment', paymentId });
      db.database.exec("UPDATE staff SET role='staff' WHERE id='demo-retoucher'");
      await expectError(await confirm(), 409, 'RETOUCHER_REQUIRED');
      db.database.exec("UPDATE staff SET role='retoucher' WHERE id='demo-retoucher'");

      const batch = db.batch.bind(db);
      db.batch = (statements) => {
        db.database.exec("UPDATE staff SET active=0 WHERE id='demo-retoucher'");
        return batch(statements);
      };
      await expectError(await confirm(), 409, 'CONFLICT');
      assert.equal(
        db.database.prepare('SELECT state FROM payments WHERE id=?').get(paymentId ?? null)?.state,
        'pending',
      );
      db.batch = batch;
      db.database.exec("UPDATE staff SET active=1 WHERE id='demo-retoucher'");
      assert.equal((await confirm()).status, 200);
      db.database.exec("UPDATE staff SET active=0 WHERE id='demo-retoucher'");
      assert.equal((await confirm()).status, 200);
      assert.equal(
        db.database
          .prepare("SELECT COUNT(*) AS n FROM retouch_jobs WHERE shoot_id='demo-selection'")
          .get()?.n,
        1,
      );
    },
  );

  await t.test('revision rejects an assignee with a different role', async () => {
    const { api, db } = setup();
    const cookie = await customerLogin(api, 'demo-result-access', '1004');
    db.database.exec("UPDATE staff SET role='staff' WHERE id='demo-retoucher'");
    await expectError(
      await api('/api/shoots/demo-result/actions', {
        method: 'POST',
        cookie,
        body: {
          type: 'request_revision',
          items: [{ photoId: 'demo-result-photo-1', comment: '가상 수정 요청' }],
        },
      }),
      409,
      'RETOUCHER_REQUIRED',
    );
    assert.equal(
      db.database
        .prepare("SELECT id FROM requests WHERE shoot_id='demo-result' AND type='revision'")
        .get(),
      undefined,
    );
  });
});
