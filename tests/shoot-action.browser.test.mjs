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
              import { useShootDetail } from '/apps/frontend-admin-page/src/features/shoot-detail/use-shoot-detail.ts';

              import { BookingSchedule } from '/apps/frontend-admin-page/src/features/shoot-detail/booking-schedule.tsx';
              function Probe() {
                const { shoot, busy, error, success, perform } = useShootDetail('test-shoot');
                const [result, setResult] = useState('idle');

                async function submit(action) {
                  setResult('pending');
                  const saved = await perform(action); setResult(String(saved)); return saved;
                }

                return React.createElement('main', null,
                  React.createElement('output', { 'data-testid': 'detail' }, JSON.stringify(shoot ?? null)),
                  React.createElement('output', { 'data-testid': 'success' }, success),
                  React.createElement('output', { 'data-testid': 'error' }, error),
                  React.createElement('output', { 'data-testid': 'busy' }, String(busy)),
                  React.createElement('output', { 'data-testid': 'result' }, result),
                  shoot && React.createElement(BookingSchedule, { shoot,busy,perform:submit }));
              }

              createRoot(document.getElementById('root')).render(React.createElement(Probe));`;
        },
      },
    ],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { entries: [], include: ['react', 'react-dom/client'] },
    server: {
      host: '127.0.0.1',
      port: 0,
      watch: null,
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
          const before = {
            id: 'test-shoot',
            status: 'preparing',
            capabilities: ['confirm_schedule'],
            timeOptions: [
              { id: 'first', date: '2099-12-20', time: '13:00' },
              { id: 'second', date: '2099-12-21', time: '11:00' },
            ],
            confirmedSchedule: failFirst
              ? { optionId: 'first', location: '기존 장소', confirmedAt: '2026-11-05' }
              : null,
          };
          const after = {
            ...before,
            confirmedSchedule: {
              optionId: 'second',
              location: '테스트 스튜디오',
              confirmedAt: '2026-11-06',
            },
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
                  type: 'confirm_schedule',
                  ...(failFirst ? { previousOptionId: 'first' } : {}),
                  optionId: 'second',
                  location: '테스트 스튜디오',
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
            await page.getByRole('heading', { name: '예약 일정' }).waitFor({ timeout: 60000 });
            if (failFirst)
              await page.getByRole('button', { name: '일정 변경', exact: true }).click();
            const time = page.getByRole('combobox', { name: '확정할 희망 일정' });
            const location = page.getByLabel('확정 촬영 장소');
            if (failFirst) {
              assert.equal(await time.inputValue(), 'first');
              assert.equal(await location.inputValue(), '기존 장소');
            }
            await time.selectOption('second');
            await location.fill('테스트 스튜디오');
            const submit = page.getByRole('button', {
              name: failFirst ? '변경한 일정 저장' : '일정과 장소 확정',
              exact: true,
            });
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
