// 렌더 지연 후에도 앵커·모달·본문 좌표가 유지되는지 실제 브라우저에서 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const appUrl = process.env.LANDING_APP_URL;
test(
  'landing preserves layout, anchor navigation and viewport modals',
  { skip: !appUrl, timeout: 180000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const results = {};
    const baseline = process.env.LANDING_LAYOUT_BASELINE
      ? JSON.parse(await readFile(process.env.LANDING_LAYOUT_BASELINE, 'utf8'))
      : undefined;
    const output = process.env.LANDING_VISUAL_DIR;
    if (output) await mkdir(output, { recursive: true });
    try {
      for (const width of [390, 1440]) {
        for (const route of ['/', '/terms', '/privacy', '/recommend']) {
          const context = await browser.newContext({
            viewport: { width, height: 900 },
            reducedMotion: 'reduce',
          });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', (error) => errors.push(error.message));
          await page.goto(new URL(route, appUrl).href, { waitUntil: 'networkidle' });
          await page.evaluate(() => document.fonts.ready);
          if (route === '/') {
            await page.waitForSelector('[data-motion-ready="true"]');
            for (const section of await page.locator('main > section').all()) {
              await section.scrollIntoViewIfNeeded();
            }
            await page.locator('.team-card[data-team="influencer"]').click();
            await page.locator('#team-modal-grid img').nth(8).waitFor({ state: 'attached' });
            const modal = await page.locator('#team-modal').boundingBox();
            assert.ok(
              Math.abs(modal.x) < 1 && Math.abs(modal.y) < 1,
              'fixed modal covers viewport',
            );
            assert.ok(Math.abs(modal.width - width) < 1 && Math.abs(modal.height - 900) < 1);
            await page.keyboard.press('Escape');
            await page.evaluate(
              () =>
                new Promise((resolve) => {
                  addEventListener(
                    'hashchange',
                    () => requestAnimationFrame(() => requestAnimationFrame(resolve)),
                    { once: true },
                  );
                  location.hash = 'pricing';
                }),
            );
            await page.waitForFunction(() => {
              const rect = document.querySelector('#pricing').getBoundingClientRect();
              return rect.top >= -2 && rect.top < 200;
            });
          }
          await page.evaluate(() => {
            history.replaceState(null, '', location.pathname + location.search);
            scrollTo({ top: 0, behavior: 'instant' });
          });
          await page.waitForFunction(() => scrollY === 0);
          await page.evaluate(() => document.fonts.ready);
          const key = `${width}${route}`;
          results[key] = await page.evaluate(() =>
            [
              ...document.querySelectorAll(
                'main > section, main h1, main h2, #hero p, #hero [data-icon]',
              ),
            ].map((element) => {
              const box = element.getBoundingClientRect();
              const css = getComputedStyle(element);
              return {
                tag: element.tagName,
                id: element.id,
                text: element.textContent.trim().slice(0, 45),
                rect: [box.x, box.y + scrollY, box.width, box.height],
                fontSize: css.fontSize,
                fontWeight: css.fontWeight,
                color: css.color,
              };
            }),
          );
          if (baseline?.[key]) {
            assert.equal(results[key].length, baseline[key].length, key);
            results[key].forEach((item, index) => {
              const expected = baseline[key][index];
              for (const property of ['tag', 'id', 'text', 'fontSize', 'fontWeight', 'color']) {
                assert.equal(
                  item[property],
                  expected[property],
                  `${key} ${item.id || item.tag} ${property}`,
                );
              }
              item.rect.forEach((value, axis) =>
                assert.ok(
                  Math.abs(value - expected.rect[axis]) < 1,
                  `${key} ${item.id || item.tag} geometry ${axis}: ${value} vs ${expected.rect[axis]}`,
                ),
              );
            });
          }
          assert.deepEqual(errors, []);
          if (output)
            await page.screenshot({
              path: path.join(output, `${width}-${route.replaceAll('/', '') || 'home'}.png`),
            });
          if (route === '/') {
            await page.goto(new URL('/#pricing', appUrl).href, { waitUntil: 'networkidle' });
            await page.waitForFunction(() => {
              const top = document.querySelector('#pricing').getBoundingClientRect().top;
              return top >= -2 && top < 200;
            });
            await page.emulateMedia({ media: 'print' });
            assert.equal(
              await page
                .locator('#how')
                .evaluate((element) => getComputedStyle(element).contentVisibility),
              'visible',
              'print renders every section',
            );
          }
          await context.close();
        }
      }
      if (output)
        await writeFile(path.join(output, 'geometry.json'), JSON.stringify(results, null, 2));
    } finally {
      await browser.close();
    }
  },
);

test(
  'first smooth anchor navigation reaches its target before sections have been measured',
  { skip: !appUrl, timeout: 60000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        await page.goto(appUrl, { waitUntil: 'networkidle' });
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              addEventListener('scrollend', resolve, { once: true });
              document.querySelector('#main-nav a[href="#pricing"]').click();
            }),
        );
        assert.ok(
          Math.abs(
            await page
              .locator('#pricing')
              .evaluate((element) => element.getBoundingClientRect().top),
          ) < 2,
        );
        await page.locator('#back-to-top').click();
        await page.waitForFunction(() => scrollY === 0);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  },
);
