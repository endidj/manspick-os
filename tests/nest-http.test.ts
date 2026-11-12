// Nest와 Fetch의 연결 경계에서 본문 소유권과 누락된 요청 문맥의 실패 처리를 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { inject } from 'light-my-request';
import { createApplication } from '../apps/server/src/http/app.ts';
import { routingRequest } from '../apps/server/src/http/routing-request.ts';

test('Node routing leaves JSON and multipart bodies unread for the guarded Fetch parsers', async () => {
  const form = new FormData();
  form.set('file', new File(['image bytes'], 'image.png', { type: 'image/png' }));
  for (const body of ['{"type":"note"}', form]) {
    const original = new Request('https://admin.example/api/uploads?scope=private', {
      method: 'POST',
      headers: { Cookie: 'manspick_staff=test', Origin: 'https://admin.example' },
      body,
    });
    original.headers.set('Content-Length', '999');
    const routed = routingRequest(original);
    assert.equal(routed.body, null);
    assert.equal(routed.headers.has('Content-Length'), false);
    assert.equal(routed.url, original.url);
    assert.equal(routed.method, 'POST');
    assert.equal(routed.headers.get('Cookie'), 'manspick_staff=test');
    assert.equal(routed.headers.get('Origin'), 'https://admin.example');
    assert.equal(original.bodyUsed, false);
    assert.equal(original.headers.get('Content-Length'), '999');
    if (typeof body === 'string') assert.equal(await original.text(), body);
    else
      assert.equal(await ((await original.formData()).get('file') as File).text(), 'image bytes');
  }
});

test('a missing request binding fails with a private response instead of hanging', async (context) => {
  const app = await createApplication();
  context.after(() => app.close());
  context.mock.method(console, 'error', () => {});
  const response = await inject(app.getHttpAdapter().getInstance(), { url: '/api/health' });
  assert.equal(response.statusCode, 500);
  assert.equal(response.json().error.code, 'INTERNAL_ERROR');
  assert.ok(!response.payload.includes('bindings'));
  assert.ok(response.headers['x-request-id']);
});
