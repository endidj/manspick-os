// 고객 계정 연결, 촬영 운영 기록과 물리 테이블을 실제 마이그레이션으로 검증합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { setup } from './helpers/booking-db.ts';
import { beginSocial, finishSocial } from '../apps/server/src/security/customer-social.ts';
import { hash } from '../apps/server/src/security/crypto.ts';
import { act } from '../apps/server/src/shoots/actions.ts';
import { shootDetail } from '../apps/server/src/shoots/queries.ts';
import type { Actor } from '@manspick/contracts';

test('social login consumes state in the issuing booking session and records signup or login once', async (t) => {
  const { db, env } = setup();
  env.GOOGLE_CLIENT_ID = 'test-client';
  env.GOOGLE_CLIENT_SECRET = 'test-secret';
  const token = 'a'.repeat(64);
  const request = new Request('http://localhost/api', {
    headers: { Cookie: 'manspick_customer=' + token },
  });
  const actor: Actor = {
    id: 'demo-payment',
    shootId: 'demo-payment',
    kind: 'customer',
    name: '고객',
    role: 'customer',
  };
  db.prepare(
    "INSERT INTO sessions(token_hash,kind,shoot_id,token_version,created_at,expires_at) VALUES(?,'customer',?,1,CURRENT_TIMESTAMP,'2099-01-01')",
  ).run(await hash(token), actor.id);
  t.mock.method(globalThis, 'fetch', async (url: string) =>
    Response.json(
      url.includes('userinfo') ? { sub: '123456789' } : { access_token: 'test-access' },
    ),
  );
  for (const event of ['signup', 'login']) {
    const { url } = await beginSocial(request, env, actor, 'google');
    const state = new URL(url).searchParams.get('state')!;
    const other = new Request(request.url, {
      headers: { Cookie: 'manspick_customer=' + 'b'.repeat(64) },
    });
    await assert.rejects(finishSocial(other, env, actor, 'google', state, 'code'), {
      code: 'INVALID_SOCIAL_STATE',
    });
    assert.deepEqual(await finishSocial(request, env, actor, 'google', state, 'code'), {
      verified: true,
    });
    await assert.rejects(finishSocial(request, env, actor, 'google', state, 'code'), {
      code: 'INVALID_SOCIAL_STATE',
    });
    assert.equal(
      db
        .prepare('SELECT COUNT(*) AS n FROM analytics_events WHERE event_name=? AND booking_id=?')
        .get(event, actor.id)?.n,
      1,
    );
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM customer_social_accounts').get()?.n, 1);
});

test('tasks and campaign participation stay staff-only and booking tables are physical', async () => {
  const { db, env } = setup();
  const admin: Actor = { kind: 'staff', id: 'demo-admin', name: '관리자', role: 'admin' };
  const customer: Actor = {
    kind: 'customer',
    id: 'demo-payment',
    shootId: 'demo-payment',
    name: '고객',
    role: 'customer',
  };
  const booking = customer.id;
  for (const name of [
    'items',
    'booking_photos',
    'shoot_briefs',
    'booking_events',
    'booking_notes',
    'booking_surveys',
    'director_item_skills',
  ])
    assert.equal(
      db.prepare('SELECT type FROM sqlite_schema WHERE name=?').get(name)?.type,
      'table',
    );
  const added = await act(env, admin, booking, { type: 'add_task', title: '집결지 확인' });
  const taskId = added.tasks![0]!.id;
  await assert.rejects(act(env, customer, booking, { type: 'complete_task', taskId }), {
    code: 'FORBIDDEN',
  });
  assert.ok(
    (await act(env, admin, booking, { type: 'complete_task', taskId })).tasks?.[0]?.completedAt,
  );
  assert.ok(
    (
      await act(env, admin, booking, { type: 'enter_campaign', campaignId: 'review-demo' })
    ).campaigns?.find((c) => c.id === 'review-demo')?.entered,
  );
  const detail = await shootDetail(env, customer, booking);
  assert.deepEqual(detail.tasks, []);
  assert.deepEqual(detail.campaigns, []);
  assert.equal('fileLinks' in detail, false);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
});
