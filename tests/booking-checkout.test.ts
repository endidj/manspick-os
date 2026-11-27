// 공개 예약 API의 결제 경로, 가상 승인 금액, 예약 완료 시점을 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import type { BookingResultDTO } from '@manspick/contracts';
import { datePlusDays, koreaDate } from '../packages/domain/src/index.ts';
import { metrics } from '../apps/server/src/analytics/analytics.ts';
import { setup } from './helpers/booking-db.ts';
import { handleRequest } from './helpers/server.ts';

const order = {
  name: '체크아웃 테스트',
  packageId: 'hybrid',
  addons: [{ id: 'rental', quantity: 1 }],
  timeOptions: [{ date: datePlusDays(koreaDate(new Date()), 18), time: '13:00' }],
  privacyConsent: true,
  serviceNotificationConsent: true,
};

function submit(body: object, origin = 'http://localhost') {
  return new Request(origin + '/api/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'X-Manspick-Surface': 'user' },
    body: JSON.stringify({ ...order, ...body }),
  });
}

async function receipt(response: Response) {
  assert.equal(response.status, 201);
  return ((await response.json()) as { data: BookingResultDTO }).data;
}

test('direct test checkout requires explicit approval at the displayed price and completes exactly once', async (t) => {
  const { env, db } = setup();
  t.after(() => db.close());
  const phone = '01070112233';
  const checkout = { phone, paymentChannel: 'pg', testCheckoutAmountKrw: 185000 };
  const records = () =>
    db
      .prepare(
        `SELECT s.id, s.status, s.starts_at, p.amount, p.state, p.provider,
              p.provider_transaction_id, p.confirmed_at, p.confirmed_by
       FROM customers c JOIN shoots s ON s.customer_id=c.id
       JOIN payments p ON p.shoot_id=s.id AND p.kind='base' WHERE c.phone=?`,
      )
      .all(phone);
  assert.equal((await handleRequest(submit(checkout), env)).status, 400);
  assert.equal(
    (
      await handleRequest(
        submit({ ...checkout, testCheckoutApproved: true, testCheckoutAmountKrw: 180000 }),
        env,
      )
    ).status,
    409,
  );
  const approved = { ...checkout, testCheckoutApproved: true };
  assert.equal(
    (
      await handleRequest(submit(approved, 'https://customer.example'), {
        ...env,
        LOCAL_DEMO: 'false',
      })
    ).status,
    503,
  );
  assert.equal(records().length, 0);
  const publicTest = { ...env, LOCAL_DEMO: 'false', CUSTOMER_TEST: true };
  const create = () => handleRequest(submit(approved, 'https://customer.example'), publicTest);
  const results = await Promise.all([create(), create()]);
  const receipts = await Promise.all(results.map(receipt));
  assert.equal(
    receipts.filter((r) => r.bookingStatus === 'complete' && r.bookingAccess?.token).length,
    1,
  );
  const [paid] = records();
  assert.equal(records().length, 1);
  assert.equal(paid.status, 'survey_pending');
  assert.equal(paid.starts_at, null);
  assert.equal(paid.amount, 185000);
  assert.equal(paid.state, 'confirmed');
  assert.equal(paid.provider, 'test_checkout');
  assert.ok(paid.provider_transaction_id);
  assert.ok(paid.confirmed_at);
  assert.equal(paid.confirmed_by, null);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS n FROM booking_confirmations WHERE booking_id=?').get(paid.id)
      ?.n,
    0,
  );
});

test('external prepaid reservations bypass checkout without increasing first-party receipts', async (t) => {
  const { env, db } = setup();
  t.after(() => db.close());
  const before = (await metrics(env)).confirmedPayments;
  const channels = ['kmong', 'soomgo', 'frip', 'smartstore'];
  for (const [i, channel] of channels.entries()) {
    const phone = '0107011224' + i;
    const res = await handleRequest(
      submit({ phone, paymentChannel: channel, platformNickname: '민수', paymentAmount: 170000 }),
      env,
    );
    const data = await receipt(res);
    assert.ok(data.localAccess);
    assert.equal(data.bookingStatus, 'complete');
    const info = db
      .prepare(
        `SELECT s.status, s.starts_at, o.platform_nickname, o.sales_channel, o.total_amount_krw, p.amount, p.state, p.provider_transaction_id, p.confirmed_by
       FROM shoots s JOIN orders o ON o.id=s.id JOIN payments p ON p.order_id=o.id WHERE s.id=?`,
      )
      .get(data.localAccess.shootId);
    assert.ok(info);
    assert.equal(info.status, 'survey_pending');
    assert.equal(info.starts_at, null);
    assert.equal(info.sales_channel, channel);
    assert.equal(info.platform_nickname, '민수');
    assert.equal(info.total_amount_krw, 185000);
    assert.equal(info.amount, 170000);
    assert.equal(info.state, 'confirmed');
    assert.equal(info.provider_transaction_id, null);
    assert.equal(info.confirmed_by, null);
  }
  assert.equal((await metrics(env)).confirmedPayments, before);
});
