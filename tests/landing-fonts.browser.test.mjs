// 필요한 폰트만 먼저 받고 같은 파일을 중복 다운로드하지 않는지 브라우저에서 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.LANDING_APP_URL;

test(
  'landing font hints are route-specific and reuse the CSS font requests',
  { skip: !appUrl, timeout: 180000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const results = [];
    try {
      for (const width of [390, 1440]) {
        for (const path of ['/', '/recommend', '/terms', '/privacy']) {
          const context = await browser.newContext({
            viewport: { width, height: 900 },
            reducedMotion: 'reduce',
          });
          try {
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', (error) => errors.push(error.message));
            assert.equal(
              (await page.goto(new URL(path, appUrl).href, { waitUntil: 'networkidle' })).status(),
              200,
            );
            await page.evaluate(() => document.fonts.ready);
            const fonts = await page.evaluate(() => ({
              hints: [...document.querySelectorAll('head link[rel="preload"][as="font"]')].map(
                (link) => ({ href: link.href, type: link.type, crossOrigin: link.crossOrigin }),
              ),
              requests: performance
                .getEntriesByType('resource')
                .filter((entry) => new URL(entry.name).pathname.endsWith('.woff2'))
                .map((entry) => ({
                  url: entry.name,
                  initiator: entry.initiatorType,
                  bytes: entry.encodedBodySize,
                })),
              overflow: document.documentElement.scrollWidth > innerWidth,
            }));
            const displayFont = path === '/' || path === '/recommend';
            assert.equal(fonts.hints.length, displayFont ? 2 : 1, `${width}${path} preload count`);
            assert.equal(
              fonts.requests.some((request) =>
                /PretendardVariable\.woff2(?:$|\?)/.test(request.url),
              ),
              false,
            );
            assert.equal(
              fonts.requests.some((request) => /GeistVariable/.test(request.url)),
              displayFont,
              `${path} Geist must only load where used`,
            );
            assert.equal(
              new Set(fonts.requests.map((request) => request.url)).size,
              fonts.requests.length,
              `${path} duplicate font request`,
            );
            for (const hint of fonts.hints) {
              assert.equal(hint.type, 'font/woff2');
              assert.equal(hint.crossOrigin, 'anonymous');
              assert.equal(new URL(hint.href).origin, new URL(appUrl).origin);
              assert.equal(fonts.requests.filter((request) => request.url === hint.href).length, 1);
              assert.equal(
                fonts.requests.find((request) => request.url === hint.href).initiator,
                'link',
              );
            }
            assert.equal(fonts.overflow, false);
            assert.equal(await page.locator('h1').isVisible(), true);
            assert.deepEqual(errors, []);
            results.push({
              width,
              path,
              preloads: fonts.hints.length,
              fonts: fonts.requests.length,
              bytes: fonts.requests.reduce((total, request) => total + request.bytes, 0),
            });
          } finally {
            await context.close();
          }
        }
      }
      console.log(JSON.stringify(results));
    } finally {
      await browser.close();
    }
  },
);
