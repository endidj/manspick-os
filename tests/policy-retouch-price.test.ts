// 추가 보정 단가 변경이 새 결제에만 적용되고 접수한 주문 단가는 유지되는지 확인합니다.
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import test from 'node:test';
import { retouchOffering, retouchUnitPrice } from '../apps/server/src/settings/retouch-price.ts';
import { retouchOrder } from '../apps/server/src/shoots/commands/extra-retouch.ts';
import type { CommandContext } from '../apps/server/src/shoots/commands/types.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';

test('retouch orders snapshot the editable addon price and keep older pending amounts', async () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE addons(id TEXT PRIMARY KEY, price INTEGER,active INTEGER DEFAULT 1);
    CREATE TABLE requests(id TEXT,shoot_id TEXT,type TEXT,message TEXT);
    CREATE TABLE payments(id TEXT,shoot_id TEXT,kind TEXT,channel TEXT,amount INTEGER);
    CREATE TABLE retouch_orders(payment_id TEXT,request_id TEXT,job_kind TEXT,quantity INTEGER,unit_price INTEGER);
    CREATE TABLE request_items(id TEXT,request_id TEXT,photo_id TEXT,comment TEXT);
  `);

  function prepare(sql: string, values: SQLInputValue[] = []) {
    return {
      bind(...bound: SQLInputValue[]) {
        return prepare(sql, bound);
      },
      async first() {
        return db.prepare(sql).get(...values) ?? null;
      },
      async run() {
        return db.prepare(sql).run(...values);
      },
    };
  }

  const env = { DB: { prepare } } as unknown as Env;
  const context = { env, shootId: 'shoot' } as CommandContext;
  try {
    assert.equal(await retouchUnitPrice(env), 10000);
    assert.deepEqual(await retouchOffering(env), { unitPrice: 10000, available: true });
    const original = await retouchOrder(context, ['p1', 'p2'], 2, 'base');
    for (const statement of original) await statement.run();
    db.exec("INSERT INTO addons(id,price) VALUES('extra_retouch',15000)");
    assert.equal(await retouchUnitPrice(env), 15000);
    const updated = await retouchOrder(context, ['p3'], 1, 'extra');
    for (const statement of updated) await statement.run();
    assert.deepEqual(
      db
        .prepare('SELECT job_kind,quantity,unit_price FROM retouch_orders ORDER BY rowid')
        .all()
        .map((row) => ({ ...row })),
      [
        { job_kind: 'base', quantity: 2, unit_price: 10000 },
        { job_kind: 'extra', quantity: 1, unit_price: 15000 },
      ],
    );
    assert.deepEqual(
      db
        .prepare('SELECT kind,amount FROM payments ORDER BY rowid')
        .all()
        .map((row) => ({ ...row })),
      [
        { kind: 'selection_extra', amount: 20000 },
        { kind: 'extra_retouch', amount: 15000 },
      ],
    );
    db.exec("UPDATE addons SET price=0 WHERE id='extra_retouch'");
    assert.equal(await retouchUnitPrice(env), 0);
    db.exec("UPDATE addons SET active=0 WHERE id='extra_retouch'");
    assert.deepEqual(await retouchOffering(env), { unitPrice: 0, available: false });
    await assert.rejects(() => retouchOrder(context, ['p4'], 1, 'extra'), {
      code: 'EXTRA_RETOUCH_UNAVAILABLE',
    });
    await assert.rejects(() => retouchOrder(context, ['p4'], 1, 'base'), {
      code: 'EXTRA_RETOUCH_UNAVAILABLE',
    });
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM payments').get()?.n, 2);
  } finally {
    db.close();
  }
});
