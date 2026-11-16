// 원본 포팅의 실제 브라우저 동작을 로컬에서 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.LANDING_APP_URL;
test(
  '원본 홈페이지의 SSR·애니메이션·갤러리·상담·반응형 흐름',
  { skip: !appUrl, timeout: 240000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const results = [];
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(appUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-motion-ready="true"]');
      for (const selector of [
        '#main-nav > div:first-child',
        '#sticky-cta > div',
        '#live-viewers-badge',
      ]) {
        assert.equal(
          await page
            .locator(selector)
            .evaluate((element) => getComputedStyle(element).backdropFilter),
          'blur(24px)',
          selector + ' must retain the source glass effect after CSS minification',
        );
      }
      await page.locator('#why').scrollIntoViewIfNeeded();
      await page.waitForSelector('#analysisChart[data-ready="true"]', { timeout: 20000 });
      await page.locator('.selfcheck-chip').nth(1).click();
      assert.match(
        await page.locator('#selfcheck-solution').innerText(),
        /의상 피드백부터 코디 제안/,
      );
      assert.equal(
        await page.locator('.selfcheck-chip').nth(1).getAttribute('aria-pressed'),
        'true',
      );
      assert.deepEqual(
        await page.evaluate(
          () =>
            window.Chart.getChart(document.querySelector('#analysisChart')).data.datasets[0].data,
        ),
        [60, 55, 62, 32, 48, 28],
      );
      results.push('radar + concern');
      await page.locator('#faq-toggle').click();
      assert.equal(await page.locator('#faq-more').isVisible(), true);
      assert.equal(await page.locator('#faq-toggle-text').innerText(), '접기');
      await page.locator('#faq-toggle').click();
      assert.equal(await page.locator('#faq-more').isVisible(), false);
      results.push('FAQ expand/collapse');
      await page.locator('.team-card[data-team="influencer"]').click();
      await page.locator('#team-modal-grid img').nth(8).waitFor({ state: 'attached' });
      assert.equal(await page.locator('#team-modal').isVisible(), true);
      assert.equal(await page.locator('#team-modal-grid img').count(), 9);
      await page
        .locator('#team-modal-grid img')
        .evaluateAll(async (images) => Promise.all(images.map((image) => image.decode())));
      assert.equal(
        await page.locator('#team-modal-grid img').nth(6).getAttribute('data-source-image'),
        'team-influencer-7.JPG',
      );
      assert.match(
        await page.locator('#team-modal-grid img').nth(6).getAttribute('src'),
        /\.webp$/,
      );
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#team-modal').isVisible(), false);
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      results.push('team gallery, images, close, scroll restore');
      await page.locator('#open-leadmodal-cta').click();
      await page.waitForSelector('#lead-modal:not(.hidden)');
      assert.equal(await page.locator('#lead-submit-btn').isDisabled(), true);
      await page.locator('#lead-name').fill('테스트');
      await page.locator('#lead-phone').fill('01012345678');
      assert.equal(await page.locator('#lead-phone').inputValue(), '010-1234-5678');
      await page.locator('#privacy-agree').check();
      assert.equal(await page.locator('#lead-submit-btn').isEnabled(), true);
      let posted;
      await context.route('https://docs.google.com/forms/**', async (route) => {
        posted = { method: route.request().method(), data: route.request().postData() };
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<title>Intercepted local test</title><p>Submission blocked by test.</p>',
        });
      });
      const popupPromise = context.waitForEvent('page');
      await page.locator('#lead-submit-btn').click();
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded');
      assert.equal(posted.method, 'POST');
      assert.match(posted.data, /entry\.779413363=/);
      assert.equal(await page.locator('#lead-thankyou').isVisible(), true);
      assert.match(await page.locator('#lead-thankyou').innerText(), /접수 결과/);
      await popup.close();
      await page.keyboard.press('Escape');
      results.push('consent, phone, Google POST intercepted (never sent)');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.locator('#mobile-menu-toggle').click();
      assert.equal(await page.locator('#mobile-menu').isVisible(), true);
      assert.equal(await page.locator('#mobile-menu-toggle').getAttribute('aria-expanded'), 'true');
      await page.locator('#mobile-menu .mobile-nav-link').first().click();
      assert.equal(await page.locator('#mobile-menu').isVisible(), false);
      results.push('mobile menu');
      await page.locator('#why').scrollIntoViewIfNeeded();
      await page.waitForTimeout(650);
      assert.equal(await page.locator('#sticky-cta').getAttribute('aria-hidden'), 'false');
      await page.locator('#cta').scrollIntoViewIfNeeded();
      await page.waitForTimeout(650);
      assert.equal(await page.locator('#sticky-cta').getAttribute('aria-hidden'), 'true');
      results.push('sticky visibility');
      assert.deepEqual(errors, []);
      const reduced = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      });
      const reducedPage = await reduced.newPage();
      await reducedPage.goto(appUrl, { waitUntil: 'networkidle' });
      await reducedPage.waitForSelector('[data-motion-ready="true"]');
      const hiddenReveals = await reducedPage
        .locator('.reveal')
        .evaluateAll(
          (elements) =>
            elements.filter((element) => getComputedStyle(element).opacity === '0').length,
        );
      assert.equal(hiddenReveals, 0);
      assert.equal(await reducedPage.locator('.count-up').first().innerText(), '1,127');
      results.push('reduced motion retains readable content and final counts');
      for (const width of [320, 390, 768, 1440]) {
        await reducedPage.setViewportSize({ width, height: 900 });
        assert.equal(
          await reducedPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          width + 'px overflow',
        );
      }
      assert.match(
        await reducedPage.locator('meta[name=robots]').getAttribute('content'),
        /noindex/,
      );
      assert.equal(await reducedPage.locator('h1').count(), 1);
      assert.match(await reducedPage.title(), /맨즈픽 MANSPICK/);
      assert.equal(await reducedPage.locator('#before-after .ba-tag').count(), 6);
      assert.equal(await reducedPage.locator('#before-after img').count(), 12);
      assert.equal(await reducedPage.locator('#faq details').count(), 11);
      assert.match(await reducedPage.locator('#pricing').innerText(), /85,000/);
      await reducedPage.locator('img').evaluateAll(async (images) => {
        images.forEach((image) => {
          image.loading = 'eager';
        });
        await Promise.all(
          images.filter((image) => image.getAttribute('src')).map((image) => image.decode()),
        );
      });
      for (const [oldPath, newPath] of [
        ['index.html', '/'],
        ['recommend.html?pkg=hybrid', '/recommend?pkg=hybrid'],
        ['terms.html', '/terms'],
        ['privacy.html', '/privacy'],
      ]) {
        const response = await context.request.get(appUrl + '/' + oldPath, { maxRedirects: 0 });
        assert.equal(response.status(), 308);
        const location = new URL(response.headers().location, appUrl);
        assert.equal(location.pathname + location.search, newPath);
      }
      assert.match(await (await context.request.get(appUrl + '/robots.txt')).text(), /Allow: \/\s/);
      assert.equal((await context.request.get(appUrl + '/api/admin/shoots')).status(), 403);
      for (const path of ['/terms', '/privacy', '/legal', '/images/og-image.jpg', '/favicon.ico']) {
        assert.equal((await context.request.get(appUrl + path)).status(), 200, path);
      }
      const noJs = await browser.newContext({ javaScriptEnabled: false });
      const staticPage = await noJs.newPage();
      assert.equal((await staticPage.goto(appUrl)).status(), 200);
      assert.ok(await staticPage.locator('h1').isVisible());
      assert.equal(await staticPage.locator('#pricing a[href^="/recommend?pkg="]').count(), 3);
      assert.equal(
        await staticPage
          .locator('#hero h1')
          .evaluate((element) => getComputedStyle(element).opacity),
        '1',
      );
      await noJs.close();
      await reduced.close();
      await context.close();
      console.log(JSON.stringify({ passed: results, pageErrors: errors }));
    } finally {
      await browser.close();
    }
  },
);
