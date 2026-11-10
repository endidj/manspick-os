// 로컬 Worker 간 서비스 바인딩과 D1/R2를 통한 사용자 흐름을 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';

const admin = 'http://127.0.0.1:3002';
const user = 'http://127.0.0.1:3001';
const landing = 'http://127.0.0.1:3000';

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
test('real local Workers D1/R2 and Vinext proxy: sessions, RBAC, bytes and shared state', async () => {
  for (const base of ['http://127.0.0.1:8787', landing, admin, user]) {
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
