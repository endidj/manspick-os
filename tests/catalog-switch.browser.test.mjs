// 상품·운영 설정과 직원 관리에서 저장·오류 복구·키보드 조작을 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

test('catalog and settings patterns preserve save, busy, selection and keyboard behavior', async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
    new URL('../.local/playwright', import.meta.url),
  );
  const { chromium } = await import('playwright');
  const server = await createServer({
    configFile: false,
    root: fileURLToPath(new URL('../', import.meta.url)),
    cacheDir: '.local/catalog-switch-vite',
    plugins: [
      react(),
      {
        name: 'catalog-switch-fixture',
        configureServer(vite) {
          vite.middlewares.use('/switch-test', async (_request, response) => {
            response.setHeader('Content-Type', 'text/html');
            response.end(
              await vite.transformIndexHtml(
                '/switch-test',
                '<div id="root"></div><script type="module" src="/switch-fixture.js"></script>',
              ),
            );
          });
        },

        resolveId(id) {
          if (id === '/switch-fixture.js') return '\0switch-fixture';
        },

        load(id) {
          if (id === '\0switch-fixture')
            return `import React from 'react';
              import { createRoot } from 'react-dom/client';
              import '@manspick/design-system/styles';
              import { Packages } from '/apps/admin/src/features/operations/packages.tsx';
              import { Settings } from '/apps/admin/src/features/operations/settings.tsx';
              createRoot(document.getElementById('root')).render(
                new URLSearchParams(location.search).has('settings')
                  ? React.createElement(Settings, { actorId: 'd1' })
                  : React.createElement(Packages, { role: 'admin' }));`;
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
    const data = {
      packages: [
        {
          id: 'one',
          name: '원',
          price: 95000,
          originalPrice: 120000,
          outfits: 1,
          duration: 60,
          retouchCount: 3,
          description: '촬영',
          active: true,
        },
      ],
      addons: [
        { id: 'hair', name: '헤어', price: 70000, maxQuantity: 1, description: '', active: true },
      ],
      staff: [
        { id: 'd1', name: '디렉터 A', role: 'director', active: true },
        { id: 'd2', name: '디렉터 B', role: 'director', active: true },
        { id: 'r1', name: '보정가 A', role: 'retoucher', active: true },
        { id: 'r2', name: '보정가 B', role: 'retoucher', active: true },
      ],
      directorSkills: [],
      retoucherRules: Array.from({ length: 7 }, (_, weekday) => ({ weekday, retoucherId: 'r1' })),
      policy: {
        holdHours: 24,
        holdCutoffHours: 2,
        bookingHorizonWeeks: 8,
        slotTimes: ['11:00', '13:00', '15:00', '17:00'],
        surveyLeadDays: 3,
        outfitLeadDays: 2,
      },
      paymentInstructions: {
        bankName: '테스트은행',
        accountNumber: '123',
        accountHolder: '운영자',
        kakaoUrl: '',
      },
      neighborhoods: [],
      preparationGuides: [],
    };
    const submissions = [];
    let failSave = false;
    const staff = data.staff.map((account) => ({
      ...account,
      email: `${account.id}@example.test`,
      version: 0,
    }));
    const staffSubmissions = [];
    await page.route('**/api/staff', async (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { data: staff } });
      const body = route.request().postDataJSON();
      staffSubmissions.push(body);
      if (staffSubmissions.length === 1)
        return route.fulfill({
          status: 409,
          json: { error: { code: 'CONFLICT', message: '이미 등록된 이메일입니다.' } },
        });
      const account = { ...body, id: 'new-staff', active: true, version: 0 };
      staff.push(account);
      await route.fulfill({ status: 201, json: { data: account } });
    });
    await page.route('**/api/staff/r1**', async (route) => {
      const account = staff.find(({ id }) => id === 'r1');
      const body = route.request().postDataJSON();
      staffSubmissions.push(body);
      if (body.version !== account.version)
        return route.fulfill({
          status: 409,
          json: { error: { code: 'CONFLICT', message: '계정이 이미 변경됐습니다.' } },
        });
      Object.assign(account, body, { version: account.version + 1 });
      await route.fulfill({ json: { data: account } });
    });
    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        submissions.push(body);
        await new Promise((resolve) => {
          releaseSave = resolve;
        });
        if (failSave) {
          await route.fulfill({
            status: 409,
            json: { error: { code: 'CONFLICT', message: '설정이 변경됐습니다.' } },
          });
          return;
        }
        if (body.type === 'retoucher_rules') data.retoucherRules = body.rules;
        else if (body.type === 'payment_instructions') data.paymentInstructions = body.value;
        else data[body.type === 'package' ? 'packages' : 'addons'][0] = body.value;
      }
      await route.fulfill({ json: { data } });
    });
    await page.goto(`${server.resolvedUrls.local[0]}switch-test`);
    const pack = page.getByRole('switch', { name: '원 판매 노출', exact: true });
    const addon = page.getByRole('switch', { name: '헤어 판매 노출', exact: true });
    await pack.waitFor();
    assert.equal(await pack.isChecked(), true);
    await pack.click();
    await page.waitForFunction(() => document.querySelector('[role="switch"]').disabled);
    assert.equal(await addon.isDisabled(), true);
    assert.equal(submissions[0].type, 'package');
    assert.equal(submissions[0].value.active, false);
    releaseSave();
    await page.getByText('변경 내용을 저장했습니다.', { exact: true }).waitFor();
    assert.equal(await pack.isChecked(), false);
    assert.equal(await pack.isDisabled(), false);

    failSave = true;
    await addon.click();
    await page.waitForFunction(() => document.querySelector('[role="switch"]').disabled);
    assert.equal(submissions[1].type, 'addon');
    assert.equal(submissions[1].value.active, false);
    releaseSave();
    await page.getByText('설정이 변경됐습니다.', { exact: false }).waitFor();
    assert.equal(await addon.isChecked(), true);
    assert.equal(await addon.isDisabled(), false);
    failSave = false;
    await addon.click();
    await page.waitForFunction(() => document.querySelector('[role="switch"]').disabled);
    releaseSave();
    await page.getByText('변경 내용을 저장했습니다.', { exact: true }).waitFor();
    assert.equal(await addon.isChecked(), false);
    assert.equal(submissions.length, 3);
    await page.getByRole('button', { name: '포함 구성 · 설명 편집', exact: true }).click();
    const draftSwitch = page.getByRole('switch', { name: '고객에게 노출', exact: true });
    const dimensions = await draftSwitch.boundingBox();
    assert.equal(dimensions.width, 36);
    assert.equal(dimensions.height, 20);
    await draftSwitch.click();
    assert.equal(await draftSwitch.isChecked(), true);
    assert.equal(submissions.length, 3);
    await page.getByRole('button', { name: '닫기', exact: true }).click();
    await page.getByText('난이도 규칙', { exact: true }).click();
    const director = page.getByRole('combobox', { name: '디렉터', exact: true });
    await director.selectOption('d2');
    assert.equal(await director.inputValue(), 'd2');
    const tuesday = page.getByRole('combobox', { name: '화요일', exact: true });
    await tuesday.selectOption('r2');
    const saveRules = page.getByRole('button', { name: '요일별 배정 기준 저장', exact: true });
    await saveRules.click();
    await page.waitForFunction(() => document.querySelector('select').disabled);
    assert.equal(await director.isDisabled(), true);
    assert.equal(await tuesday.isDisabled(), true);
    assert.equal(submissions[3].type, 'retoucher_rules');
    assert.equal(submissions[3].rules.find((rule) => rule.weekday === 2).retoucherId, 'r2');
    releaseSave();
    await page.getByText('변경 내용을 저장했습니다.', { exact: true }).waitFor();
    assert.equal(await tuesday.inputValue(), 'r2');
    const rulesTab = page.getByRole('tab', { name: '난이도 규칙', exact: true });
    const normalizationTab = page.getByRole('tab', { name: '표기 정규화', exact: true });
    assert.equal(await page.getByRole('tabpanel').count(), 1);
    assert.equal(
      await page.getByRole('tabpanel').getAttribute('aria-labelledby'),
      await rulesTab.getAttribute('id'),
    );
    await rulesTab.focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await normalizationTab.evaluate((element) => element === document.activeElement),
      true,
    );
    assert.equal(await rulesTab.getAttribute('aria-selected'), 'true');
    await page.keyboard.press('Enter');
    assert.equal(await normalizationTab.getAttribute('aria-selected'), 'true');
    await page.getByRole('button', { name: '원 표기 편집', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '패키지 편집', exact: true });
    assert.equal(
      await editor.getByRole('textbox', { name: '상품 ID', exact: true }).inputValue(),
      'one',
    );
    await editor.getByRole('combobox', { name: '기본 난이도', exact: true }).selectOption('high');
    await editor.getByRole('button', { name: '닫기', exact: true }).click();
    assert.equal(submissions.length, 4);
    await rulesTab.click();
    assert.equal(await tuesday.inputValue(), 'r2');
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );

    await page.goto(`${server.resolvedUrls.local[0]}switch-test?settings`);
    await page.getByRole('tab', { name: '운영자', exact: true }).click();
    await page.getByRole('tabpanel').getByText('디렉터 A', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: '디렉터 A 편집', exact: true }).count(), 0);
    await page.getByRole('button', { name: '직원 추가', exact: true }).click();
    const create = page.getByRole('dialog', { name: '직원 계정 등록', exact: true });
    await create.getByRole('textbox', { name: '이름', exact: true }).fill('신규 직원');
    const email = create.getByRole('textbox', { name: '회사 이메일', exact: true });
    await email.fill('duplicate@example.test');
    await create.getByRole('button', { name: '계정 저장', exact: true }).click();
    await create.getByRole('alert').getByText('이미 등록된 이메일입니다.').waitFor();
    assert.equal(await email.inputValue(), 'duplicate@example.test');
    await email.fill('new@example.test');
    await create.getByRole('button', { name: '계정 저장', exact: true }).click();
    await page.getByRole('listitem').getByText('신규 직원', { exact: true }).waitFor();
    assert.deepEqual(staffSubmissions[1], {
      name: '신규 직원',
      email: 'new@example.test',
      role: 'staff',
    });

    const edit = page.getByRole('dialog', { name: '직원 계정 편집', exact: true });
    const editAccount = page.getByRole('button', { name: '보정가 A 편집', exact: true });
    await editAccount.click();
    staff.find(({ id }) => id === 'r1').version++;
    await edit.getByRole('switch', { name: '계정 활성', exact: true }).click();
    await edit.getByRole('button', { name: '계정 저장', exact: true }).click();
    await edit.getByRole('alert').getByText('계정이 이미 변경됐습니다.').waitFor();
    assert.equal(
      await edit.getByRole('switch', { name: '계정 활성', exact: true }).isChecked(),
      false,
    );
    await edit.getByRole('button', { name: '최신 상태 불러오기', exact: true }).click();
    await editAccount.click();
    await edit.getByRole('combobox', { name: '역할', exact: true }).selectOption('director');
    await edit.getByRole('switch', { name: '계정 활성', exact: true }).click();
    await edit.getByRole('button', { name: '계정 저장', exact: true }).click();
    const staffRow = page.getByRole('listitem').filter({ hasText: '보정가 A' });
    await staffRow.getByText('디렉터 · 비활성', { exact: true }).waitFor();
    assert.deepEqual(staffSubmissions[3], { role: 'director', active: false, version: 1 });

    await staffRow.getByRole('button', { name: '보정가 A 모든 세션 종료', exact: true }).click();
    assert.equal(staffSubmissions.length, 4);
    await page
      .getByRole('dialog', { name: '모든 세션 종료', exact: true })
      .getByRole('button', { name: '모든 세션 종료', exact: true })
      .click();
    await page.getByText('이 계정의 모든 로그인 세션을 종료했습니다.', { exact: true }).waitFor();
    assert.deepEqual(staffSubmissions[4], { version: 2 });
    await page.getByRole('tab', { name: '계좌', exact: true }).click();
    const paymentCard = page
      .getByRole('tabpanel')
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: '입금 · 결제', exact: true }) });
    await paymentCard.getByRole('button', { name: '편집', exact: true }).click();
    await page.getByRole('button', { name: '입금 계좌 편집', exact: true }).click();
    const bankDialog = page.getByRole('dialog', { name: '입금 계좌 편집', exact: true });
    await bankDialog.getByRole('textbox', { name: '은행', exact: true }).fill('변경은행');
    await bankDialog.getByRole('button', { name: '계좌 저장', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('button[aria-busy="true"]'));
    assert.equal(submissions[4].type, 'payment_instructions');
    assert.equal(submissions[4].value.bankName, '변경은행');
    releaseSave();
    await page.getByText('변경 내용을 저장했습니다.', { exact: true }).waitFor();
    assert.equal(
      await page.getByRole('dialog', { name: '입금 계좌 편집', exact: true }).count(),
      0,
    );
    assert.match(await paymentCard.innerText(), /변경은행/);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      true,
    );
  } finally {
    releaseSave?.();
    await browser?.close();
    await server.close();
  }
});
