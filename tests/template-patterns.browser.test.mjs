// 템플릿의 조건 선택·제거·저장 재시도와 고객 선택이 공통 UI 교체 후에도 유지되는지 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

test('template condition chips and customer selects preserve draft and save behavior', async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
    new URL('../.local/playwright', import.meta.url),
  );
  const { chromium } = await import('playwright');
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: '.local/template-patterns-vite',
    plugins: [
      react(),
      {
        name: 'template-patterns-fixture',
        configureServer(vite) {
          vite.middlewares.use('/template-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(
              await vite.transformIndexHtml(
                '/template-test',
                '<div id="root"></div><script type="module" src="/template-fixture.js"></script>',
              ),
            );
          });
        },

        resolveId(id) {
          if (id === '/template-fixture.js') return '\0template-fixture';
        },

        load(id) {
          if (id === '\0template-fixture')
            return `import React from 'react';
          import { createRoot } from 'react-dom/client';
          import '@manspick/design-system/styles';
          import { Templates } from '/apps/admin/src/features/operations/templates.tsx';
          const role = new URLSearchParams(location.search).get('role') ?? 'admin';
          createRoot(document.getElementById('root')).render(React.createElement(Templates, { role }));`;
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
  let releaseSave;
  try {
    await server.listen();
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    let template = {
      key: '06-preparation',
      title: '준비 안내',
      body: '안녕하세요 {고객명}',
      condition: '',
      active: true,
      auto: false,
      rules: { stages: [4], packageIds: ['legacy'], addonIds: [], roles: ['admin', 'staff'] },
    };
    const submissions = [];
    const details = [];
    let listRequests = 0;
    let failSave = true;
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data;
      if (path === '/api/templates/06-preparation') {
        const value = route.request().postDataJSON();
        submissions.push(value);
        await new Promise((resolve) => {
          releaseSave = resolve;
        });
        if (failSave) {
          await route.fulfill({
            status: 409,
            json: { error: { code: 'CONFLICT', message: '템플릿이 변경됐습니다.' } },
          });
          return;
        }
        template = value;
        data = {};
      } else if (path === '/api/templates') data = { items: [template] };
      else if (path === '/api/catalog')
        data = {
          packages: [
            { id: 'one', name: '원' },
            { id: 'hybrid', name: '하이브리드' },
          ],
          addons: [{ id: 'hair', name: '헤어' }],
        };
      else if (path === '/api/shoots') {
        listRequests++;
        data = {
          shoots: [
            { id: 'first', customerName: '첫 고객', packageName: '원' },
            { id: 'second', customerName: '둘째 고객', packageName: '하이브리드' },
          ],
        };
      } else if (path.startsWith('/api/shoots/')) {
        const id = path.split('/').at(-1);
        details.push(id);
        data = {
          id,
          customerName: id === 'first' ? '첫 고객' : '둘째 고객',
          packageName: '원',
          stage: 4,
          packageId: 'one',
          addons: [],
          startsAt: null,
          package: { outfits: 1 },
        };
      } else throw new Error(`Unexpected API: ${path}`);
      await route.fulfill({ json: { data } });
    });
    await page.goto(`${server.resolvedUrls.local[0]}template-test`);
    await page.getByRole('textbox', { name: '템플릿 제목', exact: true }).waitFor();
    const picker = page.getByRole('button', { name: '패키지 조건 선택', exact: true });
    const dialog = page.getByRole('dialog', { name: '패키지 노출 조건', exact: true });
    const legacy = page.getByRole('button', { name: /패키지.*legacy.*제거/ });
    await legacy.waitFor();
    await picker.click();
    await dialog.getByRole('button', { name: '원', exact: true }).click();
    await dialog.getByRole('button', { name: '하이브리드', exact: true }).click();
    assert.equal(
      await dialog.getByRole('button', { name: '원', exact: true }).getAttribute('aria-pressed'),
      'true',
    );
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    await legacy.click();
    assert.equal(await legacy.count(), 0);
    await page.getByRole('button', { name: /패키지.*원.*제거/ }).click();
    await picker.click();
    assert.equal(
      await dialog.getByRole('button', { name: '원', exact: true }).getAttribute('aria-pressed'),
      'false',
    );
    await dialog.getByRole('button', { name: '조건 없음으로 변경', exact: true }).click();
    assert.equal(
      await dialog
        .getByRole('button', { name: '하이브리드', exact: true })
        .getAttribute('aria-pressed'),
      'false',
    );
    await dialog.getByRole('button', { name: '원', exact: true }).click();
    await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    const save = page.getByRole('button', { name: '변경 내용 저장', exact: true });
    const removal = page.getByRole('button', { name: /패키지.*원.*제거/ });
    await save.click();
    await page.waitForFunction(() => document.querySelector('[role="switch"]').disabled);
    assert.equal(await removal.isDisabled(), true);
    assert.deepEqual(submissions[0].rules, {
      stages: [4],
      packageIds: ['one'],
      addonIds: [],
      roles: ['admin', 'staff'],
    });
    releaseSave();
    await page.getByText('템플릿이 변경됐습니다.', { exact: false }).waitFor();
    assert.equal(await removal.isDisabled(), false);
    failSave = false;
    await save.click();
    await page.waitForFunction(() => document.querySelector('[role="switch"]').disabled);
    releaseSave();
    await page
      .getByText('템플릿을 저장했습니다. 외부 메시지는 발송하지 않았습니다.', { exact: true })
      .waitFor();
    assert.deepEqual(submissions[1].rules, submissions[0].rules);
    assert.equal(listRequests, 0);
    await page.getByRole('button', { name: '미리보기 고객 선택', exact: true }).click();
    const customerDialog = page.getByRole('dialog', { name: '미리보기 고객 선택', exact: true });
    await customerDialog.getByRole('combobox', { name: '고객', exact: true }).waitFor();
    await customerDialog.getByRole('button', { name: '닫기', exact: true }).click();
    assert.equal(listRequests, 1);
    const secondCustomer = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/shoots/second',
    );
    await page.locator('aside select').selectOption('second');
    await secondCustomer;
    await page.waitForFunction(() =>
      document.querySelector('aside').textContent.includes('둘째 고객'),
    );
    assert.equal(details.at(-1), 'second');
    await page.getByRole('button', { name: '미리보기 고객 선택', exact: true }).click();
    await customerDialog.getByRole('combobox', { name: '고객', exact: true }).selectOption('first');
    await customerDialog.waitFor({ state: 'hidden' });
    assert.equal(await page.locator('aside select').inputValue(), 'first');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const layout = await page.evaluate(async () => {
        await document.fonts.ready;
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth };
      });
      assert.equal(
        layout.scrollWidth <= layout.width,
        true,
        `template layout overflows at ${width}px`,
      );
      await picker.click();
      const bounds = await dialog.boundingBox();
      assert.equal(bounds.x >= 0 && bounds.x + bounds.width <= width, true);
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    }
    await page.goto(`${server.resolvedUrls.local[0]}template-test?role=staff`);
    const readOnlyTitle = page.getByRole('textbox', { name: '템플릿 제목', exact: true });
    await readOnlyTitle.waitFor();
    assert.equal(await readOnlyTitle.getAttribute('readonly'), '');
    assert.equal(
      await page.getByRole('textbox', { name: '안내 본문' }).getAttribute('readonly'),
      '',
    );
    assert.equal(await page.getByRole('button', { name: '+ 템플릿 추가', exact: true }).count(), 0);
    assert.equal(await save.count(), 0);
    assert.equal(await picker.isDisabled(), true);
  } finally {
    releaseSave?.();
    await browser?.close();
    await server.close();
  }
});
