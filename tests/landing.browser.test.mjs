// 실제 브라우저에서 원본 상담 견적·단계 모션·반응형 좌표를 확인합니다.
// LANDING_APP_URL=http://127.0.0.1:3000 node --test tests/landing.browser.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.LANDING_APP_URL?.replace(/\/+$/, '');

async function openRecommendation(page, query = '') {
  const response = await page.goto(`${appUrl}/recommend${query}`);
  await page.getByRole('main').locator('[aria-busy="false"]').waitFor();
  return response;
}

function packageRadio(page, id) {
  return page
    .getByRole('group', { name: '패키지 선택', exact: true })
    .locator(`input[type="radio"][value="${id}"]`);
}

async function expectTotal(page, amount) {
  await page
    .getByRole('main')
    .locator('footer')
    .getByText(`${amount.toLocaleString('ko-KR')}원`, { exact: true })
    .waitFor();
}

async function expectFit(page) {
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    'page must not overflow horizontally',
  );
  assert.equal(await page.locator('h1').count(), 1, 'one main heading per recommendation state');
}

test(
  'landing recommendations preserve the source consultation offer and motion',
  { skip: !appUrl && 'Set LANDING_APP_URL to a running landing app', timeout: 240000 },
  async (t) => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const screenshots = fileURLToPath(new URL('../.local/recommend-parity/', import.meta.url));
    await mkdir(screenshots, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 900 },
      reducedMotion: 'reduce',
    });
    try {
      async function scenario(name, run) {
        await t.test(name, async () => {
          const page = await context.newPage();
          const errors = [];
          page.setDefaultTimeout(15000);
          page.on('pageerror', (error) => errors.push(error.message));
          page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
          });
          try {
            await run(page);
            assert.deepEqual(errors, [], 'no runtime or console errors');
          } finally {
            await page.close();
          }
        });
      }
      await scenario(
        'all five questions, source scoring and reset do not access booking data',
        async (page) => {
          const apiRequests = [];
          page.on('request', (r) => {
            if (r.url().includes('/api/')) apiRequests.push(r.url());
          });
          assert.equal((await openRecommendation(page)).status(), 200);
          assert.equal(
            await page.getByRole('button', { name: '다음으로', exact: true }).isDisabled(),
            true,
          );
          await page.getByText('비즈니스 · 링크드인 · 이력서', { exact: true }).click();
          await page.getByRole('button', { name: '다음으로', exact: true }).click();
          await page.getByText('포즈 · 표정이 어색하다', { exact: true }).click();
          await page.getByRole('button', { name: '다음으로', exact: true }).click();
          await page.getByText('간단하게 1벌이면 충분', { exact: true }).click();
          await page.getByRole('heading', { name: '예산은 어느 정도 생각하세요?' }).waitFor();
          await page.getByText('10만원 이하', { exact: true }).click();
          await page.getByRole('heading', { name: '추가로 관심 있는 건?' }).waitFor();
          assert.equal(await page.getByRole('checkbox').count(), 6);
          await page.getByRole('button', { name: '내 맞춤 패키지 확인하기' }).click();
          await page.getByRole('heading', { name: '당신에게 딱 맞는 패키지는' }).waitFor();
          assert.equal(await packageRadio(page, 'one').isChecked(), true);
          await expectTotal(page, 85000);
          const consultation = page.getByRole('link', { name: '이 구성으로 상담하기' });
          assert.equal(new URL(await consultation.getAttribute('href')).hostname, 'pf.kakao.com');
          await page.getByRole('button', { name: '받는 구성 보기' }).click();
          await page.getByText('프리미엄 보정 5장', { exact: true }).waitFor();
          await page.getByRole('button', { name: '다시 테스트하기' }).click();
          await page.getByRole('heading', { name: '촬영 목적이 무엇인가요?' }).waitFor();
          assert.equal(
            await page.getByRole('button', { name: '다음으로', exact: true }).isDisabled(),
            true,
          );
          assert.equal(await page.getByRole('checkbox', { name: /^비즈니스/ }).isChecked(), false);
          assert.deepEqual(
            apiRequests,
            [],
            'informational consultation must not fetch or mutate booking data',
          );
        },
      );
      await scenario(
        'direct package URLs, seven options, descriptions and keyboard toggles',
        async (page) => {
          await openRecommendation(page, '?pkg=hybrid');
          await expectTotal(page, 160000);
          assert.equal(await packageRadio(page, 'hybrid').isChecked(), true);
          assert.equal(await page.locator('main article').count(), 7);
          const description = page.getByRole('button', {
            name: '헤어 스타일링 & 데일리 메이크업',
            exact: true,
          });
          await description.click();
          assert.equal(await description.getAttribute('aria-expanded'), 'true');
          await page
            .getByText(
              '촬영 당일 전문 헤어팀이 현장 방문하여 헤어 세팅 + 데일리 메이크업을 진행합니다.',
              { exact: false },
            )
            .waitFor();
          await expectTotal(page, 160000);
          const toggle = page.getByRole('switch', {
            name: '헤어 스타일링 & 데일리 메이크업 추가',
            exact: true,
          });
          await toggle.focus();
          await page.keyboard.press('Space');
          await expectTotal(page, 230000);
          await page.keyboard.press('Space');
          await expectTotal(page, 160000);
          const row = page.locator('article').filter({ has: description });
          await row.click({ position: { x: 5, y: 5 } });
          await expectTotal(page, 230000);
          await row.click({ position: { x: 5, y: 5 } });
          await expectTotal(page, 160000);
          await openRecommendation(page, '?pkg=unknown');
          await page.getByRole('heading', { name: '촬영 목적이 무엇인가요?' }).waitFor();
        },
      );
      await scenario(
        'each source clothing option has its own outfit limit and clamps on package change',
        async (page) => {
          await openRecommendation(page, '?pkg=hybrid');
          for (const name of ['인플루언서 의류 대여', '브랜드 의류 1코디 제작']) {
            const add = page.getByRole('button', { name: `${name} 수량 늘리기` });
            await add.click();
            await add.click();
            assert.equal(await add.isDisabled(), true);
            assert.equal(
              await page.getByRole('status', { name: `${name} 수량` }).textContent(),
              '2',
            );
          }
          await expectTotal(page, 310000);
          await packageRadio(page, 'one').locator('..').click();
          await expectTotal(page, 160000);
          await packageRadio(page, 'hybrid').locator('..').click();
          await expectTotal(page, 235000);
          for (const name of ['인플루언서 의류 대여', '브랜드 의류 1코디 제작']) {
            const remove = page.getByRole('button', { name: `${name} 수량 줄이기` });
            await remove.click();
            assert.equal(await remove.isDisabled(), true);
          }
          await expectTotal(page, 160000);
        },
      );
      await scenario('source geometry at 390 and 1440, no overflow at 320', async (page) => {
        for (const width of [320, 390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await openRecommendation(page);
          await page.evaluate(() => document.fonts.ready);
          await expectFit(page);
          if (width !== 320) {
            const box = await page.locator('fieldset label').first().boundingBox();
            assert.deepEqual(box, {
              x: width === 390 ? 16 : 360,
              y: width === 390 ? 284 : 288,
              width: width === 390 ? 358 : 720,
              height: 76,
            });
          }
          await page.screenshot({
            path: `${screenshots}/local-question-${width}.png`,
            fullPage: true,
          });
          await openRecommendation(page, '?pkg=hybrid');
          await expectTotal(page, 160000);
          await expectFit(page);
          await page.screenshot({
            path: `${screenshots}/local-result-${width}.png`,
            fullPage: true,
          });
          assert.equal(
            await page.getByRole('link', { name: '이 구성으로 상담하기' }).isVisible(),
            true,
          );
        }
      });
      await scenario(
        'single choice waits 300ms and step entry animates with heading focus',
        async (page) => {
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await openRecommendation(page);
          await page.getByText('소개팅 · 결혼정보회사', { exact: true }).click();
          await page.getByRole('button', { name: '다음으로' }).click();
          await page.getByText('포즈 · 표정이 어색하다', { exact: true }).click();
          await page.getByRole('button', { name: '다음으로' }).click();
          await page.getByRole('heading', { name: '원하는 촬영 규모는?' }).waitFor();
          await page.evaluate(() => {
            window.__choiceAt = 0;
            document.querySelector('input[name=scale]').addEventListener(
              'change',
              () => {
                window.__choiceAt = performance.now();
              },
              { once: true },
            );
            const observer = new MutationObserver(() => {
              if (document.querySelector('h1')?.textContent === '예산은 어느 정도 생각하세요?') {
                window.__stepDelay = performance.now() - window.__choiceAt;
                observer.disconnect();
              }
            });
            observer.observe(document.querySelector('main'), { subtree: true, childList: true });
          });
          await page.getByText('간단하게 1벌이면 충분', { exact: true }).click();
          assert.equal(
            await page.getByRole('heading', { name: '원하는 촬영 규모는?' }).isVisible(),
            true,
          );
          await page.getByRole('heading', { name: '예산은 어느 정도 생각하세요?' }).waitFor();
          const motion = await page.evaluate(() => ({
            delay: window.__stepDelay,
            duration: getComputedStyle(document.querySelector('main section')).animationDuration,
            focused: document.activeElement === document.querySelector('h1'),
          }));
          assert.ok(
            motion.delay >= 280 && motion.delay < 2000,
            `source 300ms delay, observed ${motion.delay}`,
          );
          assert.equal(motion.duration, '0.4s');
          assert.equal(motion.focused, true);
        },
      );
    } finally {
      await context.close();
      await browser.close();
    }
  },
);
