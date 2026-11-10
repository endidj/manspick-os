// 세 앱이 공유하는 요청 도구와 API 연결이 헤더·오류·비공개 응답을 보존하는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { api, action, ApiError } from '../packages/web/src/client/index.ts';
import { money, dateTime } from '../packages/web/src/format/index.ts';
import { proxyRequest } from '../packages/web/src/proxy/index.ts';

test('web client preserves request headers, credentials, JSON, FormData and typed failures', async (context) => {
  const calls: { input: string | URL | Request; options?: RequestInit }[] = [];
  context.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, options?: RequestInit) => {
      calls.push({ input, options });
      return Response.json({ data: { ok: true } });
    },
  );
  assert.deepEqual(await action('shoot-1', { type: 'note', text: 'memo' }), { ok: true });
  assert.equal(calls[0]!.input, '/api/shoots/shoot-1/actions');
  assert.equal(calls[0]!.options?.credentials, 'same-origin');
  assert.equal(calls[0]!.options?.cache, 'no-store');
  assert.equal(new Headers(calls[0]!.options?.headers).get('Content-Type'), 'application/json');
  assert.deepEqual(JSON.parse(String(calls[0]!.options?.body)), { type: 'note', text: 'memo' });

  const form = new FormData();
  form.set('file', new Blob(['sample']), 'sample.txt');
  await api('/uploads', { method: 'POST', body: form, headers: { 'X-Example': 'kept' } });
  assert.equal(calls[1]!.options?.body, form);
  assert.equal(new Headers(calls[1]!.options?.headers).get('Content-Type'), null);
  assert.equal(new Headers(calls[1]!.options?.headers).get('X-Example'), 'kept');

  context.mock.method(globalThis, 'fetch', async () =>
    Response.json({ error: { code: 'FORBIDDEN', message: '권한 없음' } }, { status: 403 }),
  );
  await assert.rejects(
    api('/private'),
    (error: unknown) =>
      error instanceof ApiError &&
      error.code === 'FORBIDDEN' &&
      error.status === 403 &&
      error.message === '권한 없음',
  );
});

test('web presentation uses Korean currency and Seoul time, including missing dates', () => {
  assert.equal(money(160000), '160,000원');
  assert.equal(money(0), '0원');
  assert.equal(dateTime(null), '일정 선택 전');
  assert.equal(dateTime(null, 'compact'), '일정 선택 전');
  assert.equal(dateTime('2026-11-06T00:30:00Z', 'compact'), '11/6 (금) 09:30');
  assert.equal(dateTime('2026-11-06T15:00:00Z', 'compact'), '11/7 (토) 00:00');
  assert.equal(
    dateTime('2026-11-06T00:30:00Z'),
    new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date('2026-11-06T00:30:00Z')),
  );
});

test('Next proxy blocks landing business routes and preserves protected upstream response bytes', async (context) => {
  let forwarded: { input: string | URL | Request; options?: RequestInit } | undefined;
  context.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, options?: RequestInit) => {
      forwarded = { input, options };
      return new Response('protected bytes', {
        status: 201,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'gzip',
          'Content-Length': '99',
          'Set-Cookie': 'session=example; HttpOnly',
        },
      });
    },
  );
  const denied = await proxyRequest(new Request('http://localhost:3000/api/shoots'), 'landing');
  assert.equal(denied.status, 403);
  assert.equal(forwarded, undefined);

  const previous = process.env.MANSPICK_LOCAL_API;
  process.env.MANSPICK_LOCAL_API = 'true';
  try {
    const response = await proxyRequest(
      new Request('http://localhost:3001/api/example?query=kept', {
        method: 'POST',
        headers: { Cookie: 'customer=example', Origin: 'http://localhost:3001' },
        body: 'request bytes',
      }),
      'user',
    );
    assert.equal(String(forwarded!.input), 'http://127.0.0.1:8787/api/example?query=kept');
    const headers = new Headers(forwarded!.options?.headers);
    assert.equal(headers.get('X-Manspick-Surface'), 'user');
    assert.equal(headers.get('Cookie'), 'customer=example');
    assert.equal(headers.get('Origin'), 'http://localhost:3001');
    assert.equal(await new Response(forwarded!.options?.body).text(), 'request bytes');
    assert.equal(response.status, 201);
    assert.equal(await response.text(), 'protected bytes');
    assert.equal(response.headers.get('Content-Encoding'), null);
    assert.equal(response.headers.get('Content-Length'), null);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.match(response.headers.get('Set-Cookie')!, /session=example/);
    context.mock.method(globalThis, 'fetch', async () => {
      throw new Error('offline');
    });
    const unavailable = await proxyRequest(new Request('http://localhost:3001/api/health'), 'user');
    assert.equal(unavailable.status, 503);
    assert.equal(
      ((await unavailable.json()) as { error: { code: string } }).error.code,
      'API_UNAVAILABLE',
    );
  } finally {
    if (previous === undefined) delete process.env.MANSPICK_LOCAL_API;
    else process.env.MANSPICK_LOCAL_API = previous;
  }
});
