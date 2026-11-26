// 공개 이벤트 재전송과 외부 기결제 방문이 비공개 지표를 왜곡하지 않는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { setup } from './helpers/booking-db.ts';
import { metrics, recordEvent } from '../apps/server/src/analytics/analytics.ts';
import { handleRequest } from './helpers/server.ts';

test('metrics deduplicate visits and confirmed transactions, exclude external checkout, and reject fabricated conversions', async () => {
  const { db, env } = setup();
  const landing = new Request('http://localhost/api/analytics/events', {
    headers: { 'X-Manspick-Surface': 'landing' },
  });
  const customer = new Request(landing, { headers: { 'X-Manspick-Surface': 'user' } });
  const visitorId = crypto.randomUUID(),
    external = crypto.randomUUID();
  const event = {
    id: crypto.randomUUID(),
    event: 'section_click',
    visitorId,
    device: 'mobile',
    section: 'pricing',
  };
  await recordEvent(env, landing, event);
  await recordEvent(env, landing, event);
  await assert.rejects(recordEvent(env, landing, { ...event, event: 'signup' }));
  await assert.rejects(recordEvent(env, landing, { ...event, section: '01000000000' }));
  for (const visit of [visitorId, external]) {
    for (const name of ['order_options', 'order_details', 'order_schedule']) {
      await recordEvent(env, customer, {
        ...event,
        id: crypto.randomUUID(),
        visitorId: visit,
        event: name,
        channel: visit === external && name !== 'order_options' ? 'kmong' : 'pg',
      });
    }
  }
  const add = db.prepare(
    'INSERT INTO analytics_events(id,event_name,visitor_id,booking_id,sales_channel) VALUES(?,?,?,?,?)',
  );
  add.run(crypto.randomUUID(), 'order_completed', visitorId, 'demo-payment', 'pg');
  add.run(crypto.randomUUID(), 'order_completed', external, 'demo-preparation', 'kmong');
  for (const name of ['signup', 'login', 'login', 'survey_started', 'survey_submitted'])
    add.run(crypto.randomUUID(), name, null, 'demo-payment', null);
  const result = await metrics(env);
  assert.equal(result.sections[0].clicks, 1);
  assert.deepEqual(
    result.orders.map((r) => r.visits),
    [1, 1, 1, 1],
  );
  assert.deepEqual(
    { ...result.postOrder },
    { completed: 2, signup: 1, login: 0, authenticated: 1, surveyStarted: 1, surveySubmitted: 1 },
  );
  assert.equal(
    result.confirmedPayments,
    db.prepare("SELECT COUNT(*) AS n FROM payments WHERE state='confirmed'").get()?.n,
  );
  assert.equal(
    (await handleRequest(new Request('http://localhost/api/analytics/metrics'), env)).status,
    401,
  );
  db.close();
});
