// 상품 추가와 비노출 저장이 공개 목록·예약 검증·기존 주문을 함께 보존하는지 확인합니다.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import { datePlusDays, koreaDate } from '../packages/domain/src/index.ts';
import { handleRequest } from './helpers/server.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';
import type { AddonDTO, OperationsSettingsDTO, PackageDTO } from '@manspick/contracts';

class Statement {
  database: DatabaseSync;
  sql: string;
  values: SQLInputValue[];

  constructor(database: DatabaseSync, sql: string, values: SQLInputValue[] = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values: SQLInputValue[]) {
    return new Statement(this.database, this.sql, values);
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

class Database {
  database = new DatabaseSync(':memory:');
  beforeBatch?: () => Promise<void>;

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
    return new Statement(this.database, sql);
  }

  async batch(statements: Statement[]) {
    await this.beforeBatch?.();
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

function setup() {
  const db = new Database();
  const env = {
    DB: db as unknown as D1Database,
    BUCKET: {} as R2Bucket,
    LOCAL_DEMO: 'true',
  } satisfies Env;

  async function api(path: string, body?: unknown, cookie = '') {
    return handleRequest(
      new Request(`http://localhost:8787/api${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Origin: 'http://localhost:3002',
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
      env,
    );
  }

  async function login(role = 'admin') {
    const response = await api('/demo/session', { role });
    assert.equal(response.status, 200);
    return response.headers.get('Set-Cookie')!.split(';')[0]!;
  }

  async function data<T>(response: Response) {
    assert.equal(response.status, 200, await response.clone().text());
    return ((await response.json()) as { data: T }).data;
  }

  return { db, api, login, data };
}

function booking(phone: string, addons: { id: string; quantity: number }[] = []) {
  return {
    name: '상품 검증',
    phone,
    packageId: 'one',
    addons,
    date: datePlusDays(koreaDate(), 28),
    time: '11:00',
    paymentChannel: 'bank',
    privacyConsent: true,
    serviceNotificationConsent: true,
  };
}

test('booking accepts every active option after the catalog grows beyond four entries', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  await data(
    await api(
      '/settings',
      {
        type: 'addon',
        value: {
          id: 'fifth-option',
          name: '다섯 번째 옵션',
          price: 10000,
          description: '로컬 회귀 전용',
          maxQuantity: 1,
          active: true,
        },
      },
      admin,
    ),
  );
  const catalog = await data<{ addons: AddonDTO[] }>(await api('/catalog'));
  assert.equal(catalog.addons.length, 5);
  const addons = catalog.addons.map((item) => ({ id: item.id, quantity: 1 }));
  const response = await api('/start', {
    ...booking('01000008004', addons),
    packageId: 'hybrid',
    time: '13:00',
  });
  assert.equal(response.status, 201, await response.clone().text());
  assert.equal(
    db.database
      .prepare(
        "SELECT COUNT(*) AS n FROM shoot_addons a JOIN shoots s ON s.id=a.shoot_id JOIN customers c ON c.id=s.customer_id WHERE c.phone='01000008004'",
      )
      .get()?.n,
    5,
  );
  assert.equal(
    (await api('/start', { ...booking('01000008005', [...addons, addons[0]!]), time: '13:00' }))
      .status,
    400,
  );
  db.database.close();
});

test('administrator can add an option and toggle it without losing historical orders', async () => {
  const { db, api, login, data } = setup();
  const cookie = await login();
  const original = db.database
    .prepare("SELECT package_snapshot FROM shoots WHERE id='demo-preparation'")
    .get()?.package_snapshot;
  const originalAddons = db.database
    .prepare('SELECT * FROM shoot_addons ORDER BY shoot_id,addon_id')
    .all();
  const option = {
    id: 'new-option',
    name: '새 부가서비스',
    price: 12300,
    description: '운영자가 추가한 옵션',
    maxQuantity: 2,
    active: true,
  };
  const notifications = db.database.prepare('SELECT COUNT(*) AS n FROM notifications').get()?.n;
  let settings = await data<OperationsSettingsDTO>(
    await api('/settings', { type: 'addon', value: option }, cookie),
  );
  assert.equal(settings.addons.find((item) => item.id === option.id)?.active, true);
  let catalog = await data<{ addons: AddonDTO[] }>(await api('/catalog'));
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(catalog.addons.find((item) => item.id === option.id)!).filter(
        ([key]) => key in option,
      ),
    ),
    option,
  );
  settings = await data<OperationsSettingsDTO>(
    await api('/settings', { type: 'addon', value: { ...option, active: false } }, cookie),
  );
  assert.equal(settings.addons.find((item) => item.id === option.id)?.active, false);
  catalog = await data<{ addons: AddonDTO[] }>(await api('/catalog'));
  assert.equal(
    catalog.addons.some((item) => item.id === option.id),
    false,
  );
  const rejected = await api('/start', booking('01000008001', [{ id: option.id, quantity: 1 }]));
  assert.equal(rejected.status, 400);
  assert.equal(
    ((await rejected.json()) as { error: { code: string } }).error.code,
    'INVALID_ADDONS',
  );
  await data(await api('/settings', { type: 'addon', value: { ...option, active: true } }, cookie));
  assert.equal(
    (await api('/start', booking('01000008002', [{ id: option.id, quantity: 1 }]))).status,
    201,
  );
  const rental = settings.addons.find((item) => item.id === 'rental')!;
  await data(
    await api(
      '/settings',
      {
        type: 'addon',
        value: { ...rental, name: '변경된 대여 상품', price: rental.price + 5000, active: false },
      },
      cookie,
    ),
  );
  assert.equal(
    db.database.prepare("SELECT package_snapshot FROM shoots WHERE id='demo-preparation'").get()
      ?.package_snapshot,
    original,
  );
  const previous = db.database
    .prepare("SELECT * FROM shoot_addons WHERE shoot_id LIKE 'demo-%' ORDER BY shoot_id,addon_id")
    .all();
  assert.deepEqual(previous, originalAddons);
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS n FROM notifications WHERE shoot_id LIKE 'demo-%'")
      .get()?.n,
    notifications,
  );
  db.database.close();
});

test('photo-only extra retouch defaults can be saved but never sold through initial booking', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  const settings = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  const extra = settings.addons.find((addon) => addon.id === 'extra_retouch')!;
  assert.equal(extra.maxQuantity, 100);
  assert.equal(extra.quantityMode, 'photo');
  await data(await api('/settings', { type: 'addon', value: { ...extra, price: 12000 } }, admin));
  const catalog = await data<{ addons: AddonDTO[]; retouchUnitPrice: number }>(
    await api('/catalog'),
  );
  assert.equal(
    catalog.addons.some((addon) => addon.id === 'extra_retouch'),
    false,
  );
  assert.equal(catalog.retouchUnitPrice, 12000);
  assert.equal(
    (await api('/start', booking('01000008107', [{ id: 'extra_retouch', quantity: 1 }]))).status,
    400,
  );
  assert.equal(
    (await api('/settings', { type: 'addon', value: { ...extra, quantityMode: 'single' } }, admin))
      .status,
    400,
  );
  db.database.close();
});

test('hidden packages stay editable for administrators and cannot be newly booked', async () => {
  const { db, api, login, data } = setup();
  const cookie = await login();
  const before = await data<OperationsSettingsDTO>(await api('/settings', undefined, cookie));
  const pack = before.packages.find((item) => item.id === 'one')!;
  const snapshot = db.database
    .prepare("SELECT package_snapshot FROM shoots WHERE id='demo-payment'")
    .get()?.package_snapshot;
  const settings = await data<OperationsSettingsDTO>(
    await api(
      '/settings',
      { type: 'package', value: { ...pack, active: false, price: pack.price + 1000 } },
      cookie,
    ),
  );
  assert.equal(settings.packages.find((item) => item.id === pack.id)?.active, false);
  const catalog = await data<{ packages: PackageDTO[] }>(await api('/catalog'));
  assert.equal(
    catalog.packages.some((item) => item.id === pack.id),
    false,
  );
  assert.equal((await api('/calendar?packageId=one')).status, 400);
  const rejected = await api('/start', booking('01000008003'));
  assert.equal(rejected.status, 400);
  assert.equal(
    ((await rejected.json()) as { error: { code: string } }).error.code,
    'INVALID_PACKAGE',
  );
  await data(await api('/settings', { type: 'package', value: { ...pack, active: true } }, cookie));
  assert.equal(
    (await data<{ packages: PackageDTO[] }>(await api('/catalog'))).packages.find(
      (item) => item.id === pack.id,
    )?.active,
    true,
  );
  assert.equal(
    db.database.prepare("SELECT package_snapshot FROM shoots WHERE id='demo-payment'").get()
      ?.package_snapshot,
    snapshot,
  );
  db.database.close();
});

test('catalog mutations require administrators and reject malformed activation values', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  const staff = await login('staff');
  const settings = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  const option = settings.addons[0]!;
  assert.equal(
    (await api('/settings', { type: 'addon', value: { ...option, active: false } }, staff)).status,
    403,
  );
  assert.equal(
    (await api('/settings', { type: 'addon', value: { ...option, active: 'yes' } }, admin)).status,
    400,
  );
  assert.equal(
    (
      await api(
        '/settings',
        { type: 'package', value: { ...settings.packages[0], active: 0 } },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (await data<OperationsSettingsDTO>(await api('/settings', undefined, admin))).addons.find(
      (item) => item.id === option.id,
    )?.active,
    true,
  );
  db.database.close();
});

test('concurrent product rule edits reject stale merges and conflicting normalization aliases', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  const settings = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  const one = settings.packages.find((pack) => pack.id === 'one')!;
  const hybrid = settings.packages.find((pack) => pack.id === 'hybrid')!;
  const responses = await Promise.all([
    api(
      '/settings',
      {
        type: 'package',
        value: { ...one, aliases: ['shared-alias'], spotDescription: '동시 변경 A' },
      },
      admin,
    ),
    api(
      '/settings',
      {
        type: 'package',
        value: { ...hybrid, aliases: ['shared-alias'], spotDescription: '동시 변경 B' },
      },
      admin,
    ),
  ]);
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.ok(responses.some((response) => [400, 409].includes(response.status)));
  const after = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  assert.equal(after.packages.filter((pack) => pack.aliases?.includes('shared-alias')).length, 1);
  const loser = responses[0]!.status !== 200 ? one : hybrid;
  assert.equal(
    (
      await api(
        '/settings',
        { type: 'package', value: { ...loser, aliases: ['shared-alias'] } },
        admin,
      )
    ).status,
    400,
  );
  const rental = after.addons.find((addon) => addon.id === 'rental')!;
  let arrived = 0;
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  db.beforeBatch = async () => {
    if (++arrived === 2) release();
    await gate;
  };
  const edits = await Promise.all([
    api(
      '/settings',
      { type: 'addon', value: { ...rental, price: rental.price + 1000, difficultyWeight: 4 } },
      admin,
    ),
    api(
      '/settings',
      {
        type: 'package',
        value: {
          ...after.packages.find((pack) => pack.id === 'allday')!,
          spotDescription: '수정된 스팟',
        },
      },
      admin,
    ),
  ]);
  assert.deepEqual(edits.map((response) => response.status).sort(), [200, 409]);
  db.beforeBatch = undefined;
  const stored = JSON.parse(
    String(
      db.database.prepare("SELECT value_json FROM settings WHERE key='catalog_rules'").get()
        ?.value_json,
    ),
  );
  assert.equal(
    Object.values(stored.packages).some((pack) => JSON.stringify(pack).includes('shared-alias')),
    true,
  );
  assert.equal(JSON.stringify(stored).includes('originalPrice'), false);
  assert.equal(JSON.stringify(stored).includes('"price"'), false);
  db.database.close();
});

test('source catalog rules are saved, validated, and applied without rewriting existing snapshots', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  const catalog = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  const pack = catalog.packages.find((item) => item.id === 'one')!;
  assert.equal((pack as unknown as Record<string, unknown>).spotDescription, '한 동네 7곳');
  assert.equal((pack as unknown as Record<string, unknown>).baseDifficulty, 'low');
  const snapshot = db.database
    .prepare("SELECT package_snapshot FROM shoots WHERE id='demo-payment'")
    .get()?.package_snapshot;
  const updated = await data<OperationsSettingsDTO>(
    await api(
      '/settings',
      {
        type: 'package',
        value: {
          ...pack,
          name: '새 원 패키지',
          spotDescription: '한 동네 8곳',
          baseDifficulty: 'medium',
          aliases: ['ONE', '원', '원 촬영'],
        },
      },
      admin,
    ),
  );
  assert.equal(
    (updated.packages.find((item) => item.id === 'one') as unknown as Record<string, unknown>)
      .spotDescription,
    '한 동네 8곳',
  );
  const booked = await api('/start', { ...booking('01000008101'), packageId: '원 촬영' });
  assert.equal(booked.status, 201, await booked.clone().text());
  const saved = db.database
    .prepare(
      "SELECT s.package_id,s.package_snapshot FROM shoots s JOIN customers c ON c.id=s.customer_id WHERE c.phone='01000008101'",
    )
    .get()!;
  assert.equal(saved.package_id, 'one');
  assert.equal(JSON.parse(String(saved.package_snapshot)).name, '새 원 패키지');
  assert.equal(JSON.parse(String(saved.package_snapshot)).baseDifficulty, 'medium');
  assert.equal(
    db.database.prepare("SELECT package_snapshot FROM shoots WHERE id='demo-payment'").get()
      ?.package_snapshot,
    snapshot,
  );
  assert.equal(
    (
      await api(
        '/settings',
        { type: 'package', value: { ...pack, baseDifficulty: 'extreme' } },
        admin,
      )
    ).status,
    400,
  );
  assert.equal(
    (await api('/settings', { type: 'package', value: { ...pack, aliases: ['HYBRID'] } }, admin))
      .status,
    400,
  );
  db.database.close();
});

test('source outfit totals, package option limits, and allowed directors constrain actual bookings', async () => {
  const { db, api, login, data } = setup();
  const admin = await login();
  const options = [
    { id: 'rental', quantity: 1 },
    { id: 'outfit', quantity: 1 },
  ];
  assert.equal((await api('/start', booking('01000008102', options))).status, 400);
  assert.equal(
    (
      await api('/start', {
        ...booking('01000008103', [{ id: 'hair', quantity: 1 }]),
        packageId: 'allday',
      })
    ).status,
    400,
  );
  const catalog = await data<OperationsSettingsDTO>(await api('/settings', undefined, admin));
  const shopping = catalog.addons.find((item) => item.id === 'shopping')!;
  await data(
    await api(
      '/settings',
      {
        type: 'addon',
        value: {
          ...shopping,
          maxQuantity: 2,
          difficultyWeight: 3,
          packageQuantityLimits: { one: 1, hybrid: 1, allday: 2 },
        },
      },
      admin,
    ),
  );
  assert.equal(
    (await api('/start', booking('01000008104', [{ id: 'shopping', quantity: 2 }]))).status,
    400,
  );
  const allday = await api('/start', {
    ...booking('01000008105', [{ id: 'shopping', quantity: 2 }]),
    packageId: 'allday',
  });
  assert.equal(allday.status, 201, await allday.clone().text());
  db.database.exec("DELETE FROM director_skills WHERE addon_id='hair'");
  const calendar = await data<{ days: { slots: { available: boolean }[] }[] }>(
    await api('/calendar?packageId=one&addons=hair'),
  );
  assert.equal(
    calendar.days.some((day) => day.slots.some((slot) => slot.available)),
    false,
  );
  assert.equal(
    (await api('/start', booking('01000008106', [{ id: 'hair', quantity: 1 }]))).status,
    409,
  );
  assert.equal(
    (await api('/settings', { type: 'addon', value: { ...shopping, difficultyWeight: -1 } }, admin))
      .status,
    400,
  );
  db.database.close();
});
