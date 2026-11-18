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
        assert.equal(await page.locator('#why, #analysisChart, a[href="#why"]').count(), 0);
        for (const section of ['#before-after', '#how', '#pricing', '#cta']) {
          assert.equal(
            await page
              .locator(section)
              .getByRole('link', { name: '맨즈픽 무료 상담', exact: true })
              .getAttribute('href'),
            'https://pf.kakao.com/_kNxoMn',
          );
        }
        const afterBadges = page.locator('#before-after .ba-tag.after');
        assert.equal(await afterBadges.count(), 6);
        assert.equal(
          await afterBadges.evaluateAll((badges) =>
            badges.every((badge) => {
              const frame = getComputedStyle(badge.parentElement, '::after');
              return [
                frame.borderTopWidth,
                frame.borderRightWidth,
                frame.borderBottomWidth,
                frame.borderLeftWidth,
              ].every((width) => width === '4px');
            }),
          ),
          true,
        );
        assert.equal(await page.locator('#hero + section').getAttribute('id'), 'real-impact');
        const hero = page.locator('#hero');
        assert.ok(await hero.evaluate((el) => el.getBoundingClientRect().height >= innerHeight));
        assert.equal(await hero.locator('h1 span').first().innerText(), '매력적인 남자');
        assert.equal(
          await hero
            .locator('h1 span')
            .last()
            .evaluate((el) => getComputedStyle(el).textDecorationStyle),
          'double',
        );
        assert.match(
          await hero.locator('h1').innerText(),
          /매력적인 남자의\s+프로필 사진은\s+어떻게 다를까요\?/,
        );
        assert.doesNotMatch(await hero.innerText(), /113만 유튜버|변신 사례 먼저/);
        assert.ok(
          await hero
            .locator('h1')
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 32),
        );
        assert.equal(await page.locator('.page-portraits').count(), 0);
        const backdrop = hero.locator('[aria-hidden="true"]').filter({ has: page.locator('img') });
        assert.equal(await backdrop.locator('img').count(), 2);
        assert.equal(await backdrop.evaluate((el) => getComputedStyle(el).position), 'absolute');
        await page.evaluate(() =>
          window.scrollTo(0, document.querySelector('#hero').offsetHeight + 100),
        );
        assert.ok(await backdrop.evaluate((el) => el.getBoundingClientRect().bottom < 0));
        await page.evaluate(() => window.scrollTo(0, 0));
        const badge = hero.getByText('46K 인플루언서가 찍어주는 프로필 사진', { exact: true });
        assert.equal(await badge.isVisible(), true);
        const badgeBox = await badge.boundingBox();
        const navBox = await page.locator('#main-nav').boundingBox();
        assert.ok(badgeBox.y > navBox.y + navBox.height);
        assert.ok(badgeBox.y < 135);
        const proofBox = await hero
          .getByText('평범남 1,127명+ 호감형으로 바뀌었습니다')
          .boundingBox();
        const consultationBox = await hero
          .getByRole('link', { name: '맨즈픽 무료 상담', exact: true })
          .boundingBox();
        assert.ok(proofBox.y > consultationBox.y + consultationBox.height);
        const subtitle = hero.getByText('7명의 전문가가 패션 헤어 보정까지', {
          exact: true,
        });
        assert.equal(await subtitle.locator('strong').count(), 0);
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
        assert.equal(await page.locator('#hero-scroll-hint').isVisible(), true);
        assert.equal(
          await page
            .locator('#main-nav')
            .getByRole('link', { name: '무료 상담', exact: true })
            .getAttribute('href'),
          'https://pf.kakao.com/_kNxoMn',
        );
        if (width < 1024) {
          await page.waitForSelector('[data-motion-ready="true"]');
          await page.locator('#mobile-menu-toggle').click();
          const first = page.locator('#mobile-menu a').first();
          assert.equal((await first.innerText()).trim(), '나한테 딱 맞는 패키지는?');
          assert.equal(await first.getAttribute('href'), '/recommend');
          await page.locator('#mobile-menu-toggle').click();
        }
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
