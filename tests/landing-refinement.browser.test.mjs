// 브랜치 미리보기의 메인 문구·모바일 가독성·추천 연결과 견적 영역을 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const appUrl = process.env.LANDING_APP_URL;
test(
  'landing refinement works on mobile and desktop',
  { skip: !appUrl, timeout: 120000 },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const directory = fileURLToPath(new URL('../.local/landing-refinement/', import.meta.url));
    await mkdir(directory, { recursive: true });
    try {
      for (const width of [320, 390, 1440]) {
        const page = await browser.newPage({
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
        });
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(appUrl);
        await page.evaluate(() => document.fonts.ready);
        const hero = page.locator('#hero');
        assert.match(
          await hero.locator('h1').innerText(),
          /매력있는 남성은\s*왜 프로필 사진부터 다를까요\?/,
        );
        assert.doesNotMatch(
          await hero.innerText(),
          /인플루언서가 직접|113만 유튜버|변신 사례 먼저|다 해드립니다/,
        );
        const subtitle = hero.getByText('7명의 전문가가 패션·헤어·보정까지 알아서', {
          exact: true,
        });
        assert.equal(
          await subtitle.evaluate(
            (el) =>
              el.getBoundingClientRect().height <= parseFloat(getComputedStyle(el).lineHeight) + 2,
          ),
          true,
          'subtitle stays on one line',
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({ path: `${directory}/hero-${width}.png` });
        await page.waitForSelector('[data-motion-ready="true"]');
        await page.evaluate(() => window.scrollTo(0, 80));
        await page.waitForFunction(
          () =>
            getComputedStyle(document.querySelector('#hero-scroll-hint')).visibility === 'hidden',
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        const cta = hero.getByRole('link', { name: '나한테 딱 맞는 패키지는?' });
        assert.equal(await cta.getAttribute('href'), '/recommend');
        await cta.click();
        await page.waitForURL('**/recommend');
        await page.goto(`${appUrl}/recommend?pkg=hybrid`);
        await page.locator('[aria-busy="false"]').waitFor();
        const footer = page.locator('main footer');
        assert.equal(
          await footer.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth) >= 2),
          true,
        );
        assert.equal(await footer.locator('#quote-summary').isVisible(), true);
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
        );
        await page.screenshot({ path: `${directory}/result-${width}.png` });
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  },
);
