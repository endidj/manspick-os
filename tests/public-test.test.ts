// 공개 테스트 Worker가 앱 표면과 시연 권한의 경계를 유지하는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { publicTestWorker } from '../apps/server/src/runtime/public-test.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';

test('public test API rejects missing, administrator, and unknown surfaces before routing', async () => {
  let calls = 0;
  const worker = publicTestWorker(async () => {
    calls++;
    return new Response('unexpected');
  });
  for (const surface of ['', 'admin', 'customer', 'unknown']) {
    const response = await worker.fetch(
      new Request('https://customer.example/api/health', {
        headers: surface ? { 'X-Manspick-Surface': surface } : {},
      }),
      {} as Env,
    );
    assert.equal(response.status, 404);
  }
  assert.equal(calls, 0);
});

test('public test requests preserve storage and body while disabling all demo privileges', async () => {
  const env = { DB: {}, BUCKET: {}, LOCAL_DEMO: 'true', ADMIN_TEST: true } as Env;
  for (const surface of ['landing', 'user']) {
    const request = new Request('https://customer.example/api/start', {
      method: 'POST',
      headers: { 'X-Manspick-Surface': surface },
      body: 'original body',
    });
    const worker = publicTestWorker(async (incoming, bindings) => {
      assert.equal(incoming, request);
      assert.equal(incoming.bodyUsed, false);
      assert.equal(bindings.DB, env.DB);
      assert.equal(bindings.BUCKET, env.BUCKET);
      assert.equal(bindings.LOCAL_DEMO, 'false');
      assert.equal(bindings.ADMIN_TEST, false);
      assert.equal(await incoming.text(), 'original body');
      return new Response('ok');
    });
    assert.equal((await worker.fetch(request, env)).status, 200);
  }
  assert.equal(env.LOCAL_DEMO, 'true');
  assert.equal(env.ADMIN_TEST, true);
});
