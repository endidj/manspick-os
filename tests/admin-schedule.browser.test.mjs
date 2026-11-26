// 운영 주간표의 슬롯 표시와 촬영별 건수를 실제 관리자 화면에서 확인합니다.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const appUrl = process.env.ADMIN_APP_URL;
test(
  '주간표는 여러 타임에 걸친 촬영을 한 건으로 세고 빈 칸을 불가로 표시한다',
  {
    skip: !appUrl,
  },
  async () => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.route('**/api/session', (route) =>
        route.fulfill({
          json: { data: { actor: { kind: 'staff', role: 'staff', id: 's', name: '직원' } } },
        }),
      );
      await page.route('**/api/schedule?*', (route) => {
        const slot = { directorId: 'd', date: '2026-11-27', time: '11:00' };
        return route.fulfill({
          json: {
            data: {
              directors: [
                { id: 'd', name: '디렉터' },
                { id: 'other', name: '휴무자' },
              ],
              retouchers: [],
              recentAssignments: [],
              slots: [
                { ...slot, state: 'reserved', shootId: 'a/b' },
                { ...slot, state: 'unavailable' },
                { ...slot, time: '13:00', state: 'held', shootId: 'a/b' },
                { ...slot, time: '17:00', state: 'available' },
              ],
            },
          },
        });
      });
      await page.goto(new URL('/?view=calendar', appUrl).href);
      const first = page.locator('a[data-state="reserved"]');
      assert.equal(await first.getAttribute('href'), '/shoots/a%2Fb');
      assert.match(await first.innerText(), /11:00\s*예약/);
      assert.match(await page.locator('a[data-state="held"]').innerText(), /13:00\s*잠금/);
      assert.equal(await page.getByText('이번 주 1건', { exact: true }).count(), 1);
      assert.equal(await page.getByText('이번 주 0건', { exact: true }).count(), 1);
      assert.equal(await page.locator('div[data-state="unavailable"]').count(), 5);
      assert.match(await page.locator('div[data-state="available"]').innerText(), /17:00\s*가능/);
    } finally {
      await browser.close();
    }
  },
);
