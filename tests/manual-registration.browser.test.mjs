// 실제 등록 폼을 브라우저에서 열어 취소·성공 후 새 고객 정보가 남지 않는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { defaultAddonRules } from '../packages/domain/src/index.ts';

test('manual registration preserves fresh forms and applies shared source quantity and calendar rules', async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
    new URL('../.local/playwright', import.meta.url),
  );
  const { chromium } = await import('playwright');
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: '.local/manual-registration-vite',
    plugins: [
      react(),
      {
        name: 'manual-registration-fixture',
        configureServer(vite) {
          vite.middlewares.use('/registration-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(
              await vite.transformIndexHtml(
                '/registration-test',
                '<div id="root"></div><script type="module" src="/registration-fixture.js"></script>',
              ),
            );
          });
        },

        resolveId(id) {
          if (id === '/registration-fixture.js') return '\0registration-fixture';
        },

        load(id) {
          if (id === '\0registration-fixture')
            return `import React from 'react';
              import { createRoot } from 'react-dom/client';
              import { ManualRegistration } from '/apps/frontend-admin-page/src/features/board/manual-registration.tsx';
              createRoot(document.getElementById('root')).render(
                React.createElement(ManualRegistration, { onCreated: async () => {} }));`;
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
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    const submissions = [];
    const calendarRequests = [];
    let failNextSubmission = false;
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      let data;
      if (path === '/api/catalog')
        data = {
          packages: [
            { id: 'one', name: '원', price: 95000, outfits: 1 },
            { id: 'hybrid', name: '하이브리드', price: 160000, outfits: 2 },
            { id: 'allday', name: '올데이', price: 500000, outfits: 4 },
          ],
          addons: [
            { id: 'hair', name: '헤어', price: 70000, maxQuantity: 1 },
            { id: 'rental', name: '의상 대여', price: 25000, maxQuantity: 4 },
            { id: 'outfit', name: '1코디 제작', price: 50000, maxQuantity: 4 },
            { id: 'shopping', name: '동행 쇼핑', price: 100000, maxQuantity: 1 },
          ].map((addon) => ({ ...addon, ...defaultAddonRules(addon.id, addon.maxQuantity) })),
        };
      else if (path === '/api/calendar') {
        calendarRequests.push(new URL(route.request().url()));
        data = { days: [{ date: '2026-11-20', slots: [{ time: '11:00', available: true }] }] };
      } else if (path === '/api/start') {
        if (failNextSubmission) {
          failNextSubmission = false;
          await route.fulfill({
            status: 409,
            json: { error: { code: 'SLOT_UNAVAILABLE', message: '선택한 시간이 마감됐습니다.' } },
          });
          return;
        }
        submissions.push(route.request().postDataJSON());
        data = { message: '접수 완료' };
      } else throw new Error(`Unexpected API: ${path}`);
      await route.fulfill({ json: { data } });
    });
    await page.goto(`${server.resolvedUrls.local[0]}registration-test`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    const open = page.getByRole('button', { name: '+ 고객 수동 등록', exact: true });
    const dialog = page.getByRole('dialog', { name: '고객 수동 등록', exact: true });
    const name = dialog.getByRole('textbox', { name: '고객 이름', exact: true });
    const phone = dialog.getByRole('textbox', { name: '휴대전화 번호', exact: true });
    const date = dialog.getByRole('combobox', { name: /^촬영 날짜/ });
    const time = dialog.getByRole('combobox', { name: /^촬영 시간/ });
    const consent = dialog.getByRole('checkbox');

    for (const submit of [false, true]) {
      await open.click();
      await name.waitFor();
      await name.fill('이전 고객');
      await phone.fill('01012345678');
      await dialog.getByLabel('헤어 · 70,000원').fill('1');
      await date.selectOption('2026-11-20');
      await time.selectOption('11:00');
      await consent.check();
      if (submit) {
        await dialog.getByRole('button', { name: '고객 접수', exact: true }).click();
        await dialog.getByText('접수 완료', { exact: true }).waitFor();
      }
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
      await open.click();
      await name.waitFor();
      assert.equal(await name.inputValue(), '');
      assert.equal(await phone.inputValue(), '');
      assert.equal(await date.inputValue(), '');
      assert.equal(await time.inputValue(), '');
      assert.equal(await dialog.getByLabel('헤어 · 70,000원').inputValue(), '0');
      assert.equal(await consent.isChecked(), false);
      assert.equal(
        await dialog.getByRole('button', { name: '고객 접수', exact: true }).isDisabled(),
        true,
      );
      await dialog.getByRole('button', { name: '닫기', exact: true }).click();
    }
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].name, '이전 고객');
    assert.equal(submissions[0].privacyConsent, true);

    await open.click();
    await name.fill('수량 검증 고객');
    await phone.fill('01087654321');
    const packageInput = dialog.getByRole('combobox', { name: /^패키지/ });
    const rental = dialog.getByLabel('의상 대여 · 25,000원');
    const outfit = dialog.getByLabel('1코디 제작 · 50,000원');
    const shopping = dialog.getByLabel('동행 쇼핑 · 100,000원');
    const submit = dialog.getByRole('button', { name: '고객 접수', exact: true });
    await dialog.getByLabel('헤어 · 70,000원').fill('1');
    await packageInput.selectOption('allday');
    assert.equal(await dialog.getByLabel('헤어 · 70,000원').count(), 0);
    assert.equal(await shopping.getAttribute('max'), '2');
    await shopping.fill('2');
    await rental.fill('1');
    const fullCalendarResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname === '/api/calendar' &&
        url.searchParams.get('addons') === 'outfit,rental,shopping'
      );
    });
    await outfit.fill('1');
    await fullCalendarResponse;
    const lastCalendar = calendarRequests.at(-1);
    assert.equal(lastCalendar.searchParams.get('packageId'), 'allday');
    assert.equal(lastCalendar.searchParams.get('addons'), 'outfit,rental,shopping');
    await packageInput.selectOption('one');
    assert.equal(await shopping.inputValue(), '1');
    assert.equal(await rental.inputValue(), '1');
    assert.equal(await outfit.inputValue(), '0');
    assert.equal(await dialog.getByLabel('헤어 · 70,000원').inputValue(), '0');
    await packageInput.selectOption('hybrid');
    await rental.fill('2');
    await outfit.fill('1');
    await consent.check();
    await date.selectOption('2026-11-20');
    await time.selectOption('11:00');
    assert.equal(await submit.isDisabled(), true);
    await dialog
      .getByText('대여와 코디 제작의 합은 패키지 의상 수를 넘을 수 없습니다.', { exact: true })
      .waitFor();
    assert.equal(submissions.length, 1);
    await outfit.fill('0');
    await date.selectOption('2026-11-20');
    await time.selectOption('11:00');
    failNextSubmission = true;
    await submit.click();
    await dialog.getByText('선택한 시간이 마감됐습니다.', { exact: true }).waitFor();
    assert.equal(await name.inputValue(), '수량 검증 고객');
    assert.equal(await phone.inputValue(), '01087654321');
    assert.equal(await rental.inputValue(), '2');
    assert.equal(await time.inputValue(), '11:00');
    await submit.click();
    await dialog.getByText('접수 완료', { exact: true }).waitFor();
    assert.equal(submissions.length, 2);
    assert.deepEqual(submissions[1].addons, [
      { id: 'rental', quantity: 2 },
      { id: 'shopping', quantity: 1 },
    ]);
  } finally {
    await browser?.close();
    await server.close();
  }
});
