// 로컬 Worker 간 서비스 바인딩과 D1/R2를 통한 사용자 흐름을 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';

// 별도 D1·R2로 띄운 검증 서버 네 개에는 같은 포트 오프셋을 지정합니다.
const portOffset = Number(process.env.LOCAL_TEST_PORT_OFFSET ?? 0);
const localOrigin = (port) => `http://127.0.0.1:${port + portOffset}`;
const admin = localOrigin(3002);
const user = localOrigin(3001);
const landing = localOrigin(3000);

async function request(base, path, { cookie, body, method = 'GET', origin, headers = {} } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(origin ? { origin } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return {
    response,
    json: JSON.parse(text),
    cookie: response.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; '),
  };
}

test('real order, deposit report, survey and director confirmation share one booking across customer and admin', async () => {
  const customerPost = (path, body, cookie) =>
    request(user, path, { method: 'POST', body, cookie, origin: 'http://localhost:3001' });
  const staffPost = (path, body, cookie) =>
    request(admin, path, { method: 'POST', body, cookie, origin: 'http://localhost:3002' });
  const [manager, director, calendar] = await Promise.all([
    staffPost('/demo/session', { role: 'admin' }),
    staffPost('/demo/session', { role: 'director' }),
    request(user, '/calendar?packageId=one'),
  ]);
  assert.equal(manager.response.status, 200);
  assert.equal(director.response.status, 200);
  assert.equal(calendar.response.status, 200);
  const options = calendar.json.data.days
    .flatMap(({ date, slots }) =>
      slots.filter((slot) => slot.available).map(({ time }) => ({ date, time })),
    )
    .slice(-2);
  assert.equal(options.length, 2);
  const phone =
    '010000' + String(crypto.getRandomValues(new Uint32Array(1))[0] % 100000).padStart(5, '0');
  const order = await customerPost('/start', {
    name: '로컬 검증 고객',
    phone,
    packageId: 'one',
    paymentChannel: 'bank',
    addons: [],
    timeOptions: options,
    serviceNotificationConsent: true,
    privacyConsent: true,
  });
  assert.equal(order.response.status, 201, JSON.stringify(order.json.error));
  const { shootId, token, last4 } = order.json.data.localAccess;
  const route = '/shoots/' + shootId;
  try {
    const customer = await customerPost('/auth/customer', { token, last4 });
    assert.equal(customer.response.status, 200);
    const initial = await request(user, route, { cookie: customer.cookie });
    assert.equal(initial.response.status, 200);
    const submitted = initial.json.data.timeOptions;
    assert.deepEqual(
      submitted.map(({ date, time }) => ({ date, time })),
      options,
    );
    assert.equal(initial.json.data.confirmedSchedule, null);
    const base = initial.json.data.payments.find((p) => p.kind === 'base');
    assert.equal(base.state, 'pending');
    const act = (body) => customerPost(route + '/actions', body, customer.cookie);
    const staffAct = (body, cookie = manager.cookie) => staffPost(route + '/actions', body, cookie);
    const deposit = await act({
      type: 'request_deposit',
      depositor: '로컬 검증',
      paymentId: base.id,
    });
    assert.equal(deposit.response.status, 200);
    assert.equal(deposit.json.data.payments.find((p) => p.id === base.id).state, 'pending');
    const paid = await staffAct({ type: 'confirm_payment', paymentId: base.id });
    assert.equal(paid.response.status, 200);
    const form = new FormData();
    form.set('kind', 'survey');
    form.set('shootId', shootId);
    form.set(
      'file',
      new File([new Uint8Array([255, 216, 255, 224])], 'survey.jpg', { type: 'image/jpeg' }),
    );
    assert.equal((await customerPost('/uploads', form, customer.cookie)).response.status, 201);
    const saved = await act({
      type: 'save_survey',
      pageDone: [1, 2, 3, 4],
      submit: true,
      answers: {
        firstImpression: 4,
        age: 30,
        style: '캐주얼',
        motivation: '프로필',
        purposes: ['프로필'],
        referral: '검색',
        safetyRead: true,
      },
    });
    assert.equal(saved.response.status, 200, JSON.stringify(saved.json.error));
    const confirmation = {
      type: 'confirm_schedule',
      optionId: submitted[1].id,
      location: '로컬 검증 스튜디오',
    };
    assert.equal((await staffAct(confirmation)).response.status, 403);
    const confirmed = await staffAct(confirmation, director.cookie);
    assert.equal(confirmed.response.status, 200, JSON.stringify(confirmed.json.error));
    const customerView = await request(user, route, { cookie: customer.cookie });
    assert.equal(customerView.json.data.confirmedSchedule.optionId, submitted[1].id);
    assert.equal(customerView.json.data.confirmedSchedule.location, confirmation.location);
    assert.equal((await staffAct(confirmation, director.cookie)).response.status, 409);
  } finally {
    const cleaned = await staffPost(
      route + '/actions',
      { type: 'cancel', reason: '로컬 자동 검사 완료' },
      manager.cookie,
    );
    assert.equal(cleaned.response.status, 200, JSON.stringify(cleaned.json.error));
  }
});

test('real local Workers D1/R2 and Vinext proxy: sessions, RBAC, bytes and shared state', async () => {
  for (const base of [localOrigin(8787), landing, admin, user]) {
    const { response, json } = await request(base, '/health');
    assert.equal(response.status, 200);
    assert.equal(json.data.storage, 'd1+r2');
    assert.equal(json.data.externalMessages, false);
  }
  const staff = await request(admin, '/demo/session', {
    method: 'POST',
    body: { role: 'admin' },
    origin: 'http://localhost:3002',
  });
  assert.equal(staff.response.status, 200);
  assert.match(staff.cookie, /^manspick_staff=/);
  const board = await request(admin, '/shoots', { cookie: staff.cookie });
  assert.equal(board.response.status, 200);
  assert.ok(board.json.data.shoots.some((s) => s.id === 'demo-preparation'));

  const login = await request(user, '/auth/customer', {
    method: 'POST',
    body: { token: 'demo-preparation-access', last4: '1002' },
    origin: 'http://localhost:3001',
  });
  assert.equal(login.response.status, 200);
  assert.match(login.cookie, /^manspick_customer=/);
  const combined = `${staff.cookie}; ${login.cookie}`;
  const userSession = await request(user, '/session', { cookie: combined });
  const staffSession = await request(admin, '/session', { cookie: combined });
  assert.equal(userSession.json.data.actor.kind, 'customer');
  assert.equal(staffSession.json.data.actor.kind, 'staff');
  const denied = await request(user, '/shoots/demo-result', { cookie: login.cookie });
  assert.equal(denied.response.status, 404);
  // 잘못된 Origin은 프런트엔드에서도 차단할 수 있어 HTTP 상태만 확인합니다.
  const csrf = await fetch(`${admin}/api/shoots/demo-preparation/actions`, {
    method: 'POST',
    headers: {
      Cookie: staff.cookie,
      Origin: 'https://untrusted.example',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'note', text: 'must not be saved' }),
  });
  assert.equal(csrf.status, 403);

  const form = new FormData();
  const png = Uint8Array.from(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  form.set('shootId', 'demo-preparation');
  form.set('kind', 'outfit');
  form.set('file', new File([png], 'local-smoke.png', { type: 'image/png' }));
  const uploaded = await request(user, '/uploads', {
    cookie: login.cookie,
    method: 'POST',
    origin: 'http://localhost:3001',
    body: form,
  });
  assert.equal(uploaded.response.status, 201);
  const asset = uploaded.json.data;
  const blob = await fetch(`${user}${asset.url}`, { headers: { cookie: login.cookie } });
  assert.equal(blob.status, 200);
  assert.equal(blob.headers.get('content-type'), 'image/png');
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), png);
  const shared = await request(admin, '/shoots/demo-preparation', { cookie: staff.cookie });
  assert.ok(shared.json.data.uploads.some((u) => u.id === asset.id));
  const anonymous = await fetch(`${user}${asset.url}`);
  assert.equal(anonymous.status, 401);
  const deniedOnLanding = await request(landing, '/shoots', { cookie: staff.cookie });
  assert.equal(deniedOnLanding.response.status, 403);

  const retoucher = await request(admin, '/demo/session', {
    method: 'POST',
    origin: 'http://localhost:3002',
    body: { role: 'retoucher' },
  });
  const masked = await request(admin, '/shoots/demo-result', { cookie: retoucher.cookie });
  assert.equal(masked.response.status, 200);
  assert.equal(masked.json.data.phoneMasked, '');
  assert.equal(masked.json.data.totalAmount, 0);
  assert.deepEqual(masked.json.data.notes, []);
  assert.equal('age' in (masked.json.data.survey?.answers ?? {}), false);
});
