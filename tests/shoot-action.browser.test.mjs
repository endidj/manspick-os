// 실제 상세 훅을 브라우저에서 실행해 저장 응답 반영과 실패 후 재시도를 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

test('shoot actions update the current detail from their POST response', async (t) => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
    new URL('../.local/playwright', import.meta.url),
  );
  const { chromium } = await import('playwright');
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: '.local/shoot-action-vite',
    plugins: [
      react(),
      {
        name: 'shoot-action-fixture',
        configureServer(vite) {
          vite.middlewares.use('/shoot-action-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(
              await vite.transformIndexHtml(
                '/shoot-action-test',
                '<div id="root"></div><script type="module" src="/shoot-action-fixture.js"></script>',
              ),
            );
          });
        },

        resolveId(id) {
          if (id === '/shoot-action-fixture.js') return '\0shoot-action-fixture';
        },

        load(id) {
          if (id === '\0shoot-action-fixture')
            return `import React, { useState } from 'react';
              import { createRoot } from 'react-dom/client';
              import { useShootDetail } from '/apps/admin/src/features/shoot-detail/use-shoot-detail.ts';

              function Probe() {
                const { shoot, busy, error, success, perform } = useShootDetail('test-shoot');
                const [result, setResult] = useState('idle');

                async function submit() {
                  setResult('pending');
                  setResult(String(await perform({ type: 'submit_selection', photoIds: ['p1'] })));
                }

                return React.createElement('main', null,
                  React.createElement('output', { 'data-testid': 'detail' }, JSON.stringify(shoot ?? null)),
                  React.createElement('output', { 'data-testid': 'success' }, success),
                  React.createElement('output', { 'data-testid': 'error' }, error),
                  React.createElement('output', { 'data-testid': 'busy' }, String(busy)),
                  React.createElement('output', { 'data-testid': 'result' }, result),
                  React.createElement('button', { disabled: busy || !shoot, onClick: submit }, '셀렉 제출'));
              }

              createRoot(document.getElementById('root')).render(React.createElement(Probe));`;
        },
      },
    ],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { include: ['react', 'react-dom/client'] },
    server: {
      host: '127.0.0.1',
      port: 0,
      watch: { ignored: ['**/.next/**', '**/.local/**', '**/.open-next/**', '**/.wrangler/**'] },
    },
  });
  let browser;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    for (const failFirst of [false, true]) {
      await t.test(
        failFirst
          ? 'failed POST preserves current data and allows a successful retry'
          : 'successful POST updates the UI without a redundant GET that could fail',
        async () => {
          const page = await browser.newPage();
          page.setDefaultTimeout(10000);
          const before = { id: 'test-shoot', status: 'selection_pending', selections: [] };
          const after = {
            ...before,
            status: 'retouch_assigned',
            selections: [{ round: 'base', photoIds: ['p1'], submittedAt: '2026-11-06' }],
          };
          const requests = [];
          let reads = 0;
          let writes = 0;
          try {
            await page.route('**/api/shoots/**', async (route) => {
              const method = route.request().method();
              requests.push(method);
              if (method === 'GET') {
                reads += 1;
                await route.fulfill(
                  reads === 1
                    ? { json: { data: before } }
                    : {
                        status: 503,
                        json: { error: { code: 'READ_UNAVAILABLE', message: '재조회 실패' } },
                      },
                );
              } else {
                assert.equal(
                  new URL(route.request().url()).pathname,
                  '/api/shoots/test-shoot/actions',
                );
                assert.deepEqual(route.request().postDataJSON(), {
                  type: 'submit_selection',
                  photoIds: ['p1'],
                });
                writes += 1;
                await route.fulfill(
                  failFirst && writes === 1
                    ? {
                        status: 409,
                        json: { error: { code: 'RETRY', message: '다시 시도해주세요' } },
                      }
                    : { json: { data: after } },
                );
              }
            });
            await page.goto(`${server.resolvedUrls.local[0]}shoot-action-test`, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
            const submit = page.getByRole('button', { name: '셀렉 제출', exact: true });
            await submit.click();
            await page
              .getByTestId('result')
              .filter({ hasText: /^(true|false)$/ })
              .waitFor();
            if (failFirst) {
              assert.deepEqual(JSON.parse(await page.getByTestId('detail').textContent()), before);
              assert.equal(await page.getByTestId('error').textContent(), '다시 시도해주세요');
              assert.equal(await page.getByTestId('success').textContent(), '');
              assert.equal(await page.getByTestId('result').textContent(), 'false');
              assert.equal(await page.getByTestId('busy').textContent(), 'false');
              assert.equal(await submit.isEnabled(), true);
              await submit.click();
              await page
                .getByTestId('result')
                .filter({ hasText: /^(true|false)$/ })
                .waitFor();
            }
            assert.deepEqual(requests, failFirst ? ['GET', 'POST', 'POST'] : ['GET', 'POST']);
            assert.deepEqual(JSON.parse(await page.getByTestId('detail').textContent()), after);
            assert.equal(await page.getByTestId('error').textContent(), '');
            assert.equal(
              await page.getByTestId('success').textContent(),
              '변경 내용을 저장했습니다.',
            );
            assert.equal(await page.getByTestId('result').textContent(), 'true');
            assert.equal(await page.getByTestId('busy').textContent(), 'false');
          } finally {
            await page.close();
          }
        },
      );
    }
  } finally {
    await browser?.close();
    await server.close();
  }
});
