// 실제 브라우저의 반응형 사진 선택·초기 용량·갤러리·슬라이드 교체를 검증합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.LANDING_APP_URL;
test(
  'landing uses responsive web copies and loads gallery images on demand',
  {
    skip: !appUrl,
    timeout: 120000,
  },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      const errors = [];
      const requests = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (request.resourceType() === 'image') requests.push(request.url());
      });
      await page.goto(appUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('[data-motion-ready="true"]');
      await page.evaluate(() => document.fonts.ready);
      const initial = await page.evaluate(() => {
        const images = performance
          .getEntriesByType('resource')
          .filter((entry) => /\.(webp|jpe?g|png)$/i.test(new URL(entry.name).pathname));
        const avatar = document.querySelector('#hero img');
        const chosen = avatar.srcset
          .split(',')
          .map((part) => part.trim().split(/\s+/))
          .find(([url]) => new URL(url, location.href).href === avatar.currentSrc);
        return {
          bytes: images.reduce((sum, entry) => sum + entry.encodedBodySize, 0),
          urls: images.map((entry) => entry.name),
          avatarWidth: Number(chosen?.[1]?.replace('w', '')),
          portraitsUseNormalSizes: [...document.querySelectorAll('#before-after img')].every(
            (image) =>
              image.srcset
                .split(',')
                .every(
                  (candidate) =>
                    Number(candidate.trim().split(/\s+/)[1]?.replace('w', '')) >=
                    Math.min(480, Number(image.getAttribute('width'))),
                ),
          ),
          invalid: [...document.querySelectorAll('img[data-source-image]')]
            .filter(
              (image) =>
                !image.srcset ||
                !image.sizes ||
                !Number(image.getAttribute('width')) ||
                !Number(image.getAttribute('height')),
            )
            .map((image) => image.dataset.sourceImage),
        };
      });
      assert.ok(initial.urls.length > 0);
      assert.ok(initial.urls.every((url) => new URL(url).pathname.endsWith('.webp')));
      assert.ok(initial.bytes > 0 && initial.bytes < 1000000, `initial images: ${initial.bytes}B`);
      assert.ok(
        initial.avatarWidth > 0 && initial.avatarWidth <= 192,
        'small avatar must select a thumbnail',
      );
      assert.deepEqual(initial.invalid, []);
      assert.equal(
        initial.portraitsUseNormalSizes,
        true,
        'large portraits must not use avatar variants',
      );
      assert.ok(
        !requests.some((url) => url.includes('team-influencer-9')),
        'closed gallery must not fetch its originals',
      );
      assert.ok(
        !requests.some((url) => url.includes('team-influencer-5')),
        'offscreen slideshow must not prefetch its next image',
      );

      const slide = page.locator('#team-influencer-img');
      await slide.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          document.querySelector('#team-influencer-img')?.dataset.sourceImage !==
          'team-influencer-3.jpg',
        undefined,
        { timeout: 15000 },
      );
      await slide.evaluate((image) => image.decode());
      const swapped = await slide.evaluate((image) => ({
        source: image.dataset.sourceImage,
        url: image.currentSrc,
        candidates: image.srcset,
        opacity: image.style.opacity,
      }));
      assert.ok(['team-influencer-5.jpg', 'location-3.jpg'].includes(swapped.source));
      assert.ok(swapped.candidates.includes(new URL(swapped.url).pathname));
      assert.match(swapped.url, /\.webp$/);
      assert.equal(swapped.opacity, '1');

      await page.locator('.team-card[data-team="influencer"]').click();
      const gallery = page.locator('#team-modal-grid img');
      await gallery.nth(8).waitFor({ state: 'attached' });
      assert.equal(await gallery.count(), 9);
      await gallery.evaluateAll(async (images) => {
        images.forEach((image) => {
          image.loading = 'eager';
        });
        await Promise.all(images.map((image) => image.decode()));
      });
      assert.ok(
        await gallery.evaluateAll((images) =>
          images.every(
            (image) => image.srcset && image.sizes && image.currentSrc.endsWith('.webp'),
          ),
        ),
      );
      await page.keyboard.press('Escape');
      await page.setViewportSize({ width: 1440, height: 1000 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
      );
      assert.deepEqual(errors, []);
      console.log(
        JSON.stringify({
          imageBytes390Dpr2: initial.bytes,
          thumbnailWidth: initial.avatarWidth,
          errors,
        }),
      );
      await context.close();
    } finally {
      await browser.close();
    }
  },
);

test(
  'three-column gallery selects appropriately sized images at mobile and desktop DPR2',
  { skip: !appUrl, timeout: 120000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: 1000 },
          deviceScaleFactor: 2,
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        await page.goto(appUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-motion-ready="true"]');
        const card = page.locator('.team-card[data-team="influencer"]');
        await card.scrollIntoViewIfNeeded();
        await page.locator('#team-influencer-img').evaluate((image) => image.decode());
        const cached = await page.evaluate(() =>
          performance.getEntriesByType('resource').map((entry) => entry.name),
        );
        await card.click();
        const gallery = page.locator('#team-modal-grid img');
        await gallery.nth(8).waitFor({ state: 'attached' });
        await gallery.evaluateAll(async (images) => {
          images.forEach((image) => {
            image.loading = 'eager';
          });
          await Promise.all(images.map((image) => image.decode()));
        });
        const images = await gallery.evaluateAll((images) =>
          images.map((image) => {
            const candidates = image.srcset.split(',').map((part) => part.trim().split(/\s+/));
            const selected = candidates.find(
              ([url]) => new URL(url, location.href).href === image.currentSrc,
            );
            const resources = performance
              .getEntriesByType('resource')
              .filter((entry) => entry.name === image.currentSrc);
            return {
              url: image.currentSrc,
              width: image.getBoundingClientRect().width,
              selectedWidth: Number(selected?.[1].replace('w', '')),
              bytes: Math.max(0, ...resources.map((entry) => entry.encodedBodySize)),
            };
          }),
        );
        assert.equal(images.length, 9);
        for (const image of images) {
          assert.ok(Math.abs(image.width - (width === 390 ? 105.333 : 238)) < 1);
          assert.ok(image.selectedWidth >= Math.ceil(image.width * 2));
          // The browser may reuse a larger photo already decoded for the team card.
          assert.ok(image.selectedWidth <= 480 || cached.includes(image.url));
        }
        const bytes = images.reduce((sum, image) => sum + image.bytes, 0);
        assert.ok(bytes > 0 && bytes < 600000, `${width}px gallery selected ${bytes}B`);
        console.log(
          JSON.stringify({
            galleryViewport: width,
            dpr: 2,
            selectedBytes: bytes,
            selectedWidths: images.map((image) => image.selectedWidth),
          }),
        );
        await context.close();
      }
    } finally {
      await browser.close();
    }
  },
);
