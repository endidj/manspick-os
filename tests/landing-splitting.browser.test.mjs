// 선택 기능 청크의 지연 로드와 느린 네트워크·실패·페이지 이탈 중 취소를 검증합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.LANDING_APP_URL;

test(
  'landing defers modal and image data bundles and safely handles pending interactions',
  { skip: !appUrl, timeout: 180000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const errors = [];
    const openPage = async () => {
      // Reduced motion keeps the image rotation from loading gallery data during this test.
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const scripts = new Set();
      const bodies = [];
      const reads = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => {
        if (response.request().resourceType() !== 'script') return;
        scripts.add(response.url());
        reads.push(
          response.text().then(
            (body) => bodies.push(body),
            () => {},
          ),
        );
      });
      await page.goto(appUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-motion-ready="true"]');
      await Promise.all(reads);
      return { context, page, scripts, bodies, reads };
    };
    const deferFirstFeature = async (page, scripts) => {
      let release;
      let observe;
      let intercepted = false;
      const gate = new Promise((resolve) => (release = resolve));
      const requested = new Promise((resolve) => (observe = resolve));
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (
          !intercepted &&
          request.resourceType() === 'script' &&
          !scripts.has(request.url()) &&
          !request.url().includes('/vendor/')
        ) {
          intercepted = true;
          observe();
          await gate;
        }
        await route.continue().catch(() => {});
      });
      return { release, requested };
    };
    try {
      const normal = await openPage();
      assert.ok(normal.bodies.length > 0);
      assert.ok(normal.bodies.every((body) => !body.includes('team-influencer-9')));
      assert.ok(normal.bodies.every((body) => !body.includes('lead-phone')));
      const lead = normal.page.locator('#open-leadmodal-cta');
      await lead.focus();
      await normal.page.keyboard.press('Enter');
      await normal.page.waitForSelector('#lead-modal:not(.hidden)');
      await Promise.all(normal.reads);
      assert.ok(normal.bodies.some((body) => body.includes('lead-phone')));
      assert.ok(normal.bodies.every((body) => !body.includes('team-influencer-9')));
      assert.equal(
        await normal.page
          .locator('#lead-modal-close')
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await normal.page.keyboard.press('Escape');
      assert.equal(await lead.evaluate((el) => el === document.activeElement), true);
      const card = normal.page.locator('.team-card[data-team="influencer"]');
      const galleryPending = await deferFirstFeature(normal.page, normal.scripts);
      await card.focus();
      await normal.page.keyboard.press('Enter');
      await galleryPending.requested;
      await normal.page.keyboard.press('Escape');
      galleryPending.release();
      await normal.page.waitForLoadState('networkidle');
      assert.equal(await normal.page.locator('#team-modal').isVisible(), false);
      assert.equal(await normal.page.locator('#team-modal-grid img').count(), 0);
      await normal.page.keyboard.press('Enter');
      await normal.page.waitForSelector('#team-modal:not(.hidden)');
      assert.equal(await normal.page.locator('#team-modal-grid img').count(), 9);
      await Promise.all(normal.reads);
      assert.ok(normal.bodies.some((body) => body.includes('team-influencer-9')));
      await normal.page.keyboard.press('Tab');
      assert.equal(
        await normal.page
          .locator('#team-modal-close')
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await normal.page.keyboard.press('Escape');
      assert.equal(await card.evaluate((el) => el === document.activeElement), true);
      assert.equal(await normal.page.evaluate(() => document.body.style.overflow), '');
      await normal.context.close();

      const delayed = await openPage();
      const pending = await deferFirstFeature(delayed.page, delayed.scripts);
      await delayed.page.locator('#open-leadmodal-cta').focus();
      await delayed.page.keyboard.press('Enter');
      await pending.requested;
      assert.equal(
        await delayed.page.locator('#open-leadmodal-cta').getAttribute('aria-busy'),
        'true',
      );
      await delayed.page.keyboard.press('Escape');
      pending.release();
      await delayed.page.waitForLoadState('networkidle');
      assert.equal(await delayed.page.locator('#lead-modal').isVisible(), false);
      assert.equal(
        await delayed.page.locator('#open-leadmodal-cta').getAttribute('aria-busy'),
        null,
      );
      assert.equal(await delayed.page.evaluate(() => document.body.style.overflow), '');
      await delayed.page.keyboard.press('Enter');
      await delayed.page.waitForSelector('#lead-modal:not(.hidden)');
      await delayed.context.close();

      const failed = await openPage();
      let aborted = false;
      await failed.page.route('**/*', async (route) => {
        const request = route.request();
        if (
          !aborted &&
          request.resourceType() === 'script' &&
          !failed.scripts.has(request.url()) &&
          !request.url().includes('/vendor/')
        ) {
          aborted = true;
          await route.abort('failed');
        } else await route.continue();
      });
      await failed.page.locator('#open-leadmodal-cta').focus();
      await failed.page.keyboard.press('Enter');
      await failed.page.waitForSelector('[data-source-module-error]');
      assert.equal(await failed.page.locator('#lead-modal').isVisible(), false);
      assert.equal(await failed.page.evaluate(() => document.body.style.overflow), '');
      await failed.page.keyboard.press('Enter');
      await failed.page.waitForSelector('#lead-modal:not(.hidden)');
      assert.equal(await failed.page.locator('[data-source-module-error]').count(), 0);
      await failed.context.close();

      const leaving = await openPage();
      const unfinished = await deferFirstFeature(leaving.page, leaving.scripts);
      await leaving.page.locator('#open-leadmodal-cta').focus();
      await leaving.page.keyboard.press('Enter');
      await unfinished.requested;
      await leaving.page.goto(new URL('/terms', appUrl).href, { waitUntil: 'domcontentloaded' });
      unfinished.release();
      await leaving.page.waitForLoadState('networkidle');
      assert.equal(await leaving.page.locator('#lead-modal').count(), 0);
      assert.equal(await leaving.page.evaluate(() => document.body.style.overflow), '');
      await leaving.context.close();
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
