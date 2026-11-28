// 고객 보드의 여섯 열과 내 정보 제출 여부가 데스크톱과 모바일에 표시되는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.ADMIN_APP_URL;
const labels = [
  '예약 및 결제 완료 (일정 대기)',
  '촬영 준비중 (일정 확정)',
  '촬영 당일',
  '촬영 완료',
  '보정 및 전달 완료 (14일 이내)',
  '후기 및 설문 완료 (14일 이내)',
];

test('고객 보드는 새 단계와 고객별 제출 결과를 표시한다', { skip: !appUrl }, async () => {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
    new URL('../.local/playwright', import.meta.url),
  );
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.route('**/api/session', (route) =>
      route.fulfill({
        json: { data: { actor: { kind: 'staff', role: 'staff', id: 'operator', name: '직원' } } },
      }),
    );
    const shoots = labels.map((_, index) => ({
      id: `sample-${index}`,
      customerName: index === 0 ? '긴이름테스트고객입니다' : `고객 ${index + 1}`,
      packageName: index % 2 === 0 ? '하이브리드' : '원',
      boardStage: index + 1,
      stage: 5,
      profileSubmitted: index % 2 === 0,
      statusLabel: '이전 상태 문구',
      nextAction: '이전 다음 동작',
      startsAt: null,
    }));
    await page.route('**/api/shoots/board?*', (route) => {
      const isBoard = new URL(page.url()).searchParams.get('view') === 'board';
      assert.equal(new URL(route.request().url()).searchParams.get('kanban'), String(isBoard));
      return route.fulfill({
        json: {
          data: {
            shoots,
            matchesByStage: [2, 1, 1, 1, 1, 1],
            counts: { total: 7, today: 0, pendingTemplates: 0, depositRequests: 0, requests: 0 },
            facets: { directors: [], packages: [], addons: [] },
            totalMatches: 7,
            pageSize: 6,
            page: 1,
          },
        },
      });
    });
    await page.goto(new URL('/?view=board', appUrl).href);
    const board = page.getByRole('region', { name: '6단계 촬영 보드' });
    await board.waitFor();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [index, label] of labels.entries()) {
        const column = board.getByRole('region', {
          name: `${label} 검색 결과 ${index === 0 ? 2 : 1}건`,
        });
        const card = column.getByRole('link');
        const badge = column.locator('header [data-tone]');
        assert.equal(await badge.innerText(), `${index + 1} · ${label.replace(' (', '\n(')}`);
        const packageLines = await card
          .getByText(shoots[index].packageName, { exact: true })
          .evaluate((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            return range.getClientRects().length;
          });
        assert.equal(packageLines, 1);
        const submitted = shoots[index].profileSubmitted;
        const status = card.getByText(submitted ? '완료' : '미완료', { exact: true });
        assert.equal(await card.getAttribute('href'), `/shoots/sample-${index}`);
        if (index >= 3) {
          assert.doesNotMatch(await card.innerText(), /내정보 입력/);
          assert.equal(await card.locator(':scope > div:visible').count(), 2);
          continue;
        }
        assert.ok(await status.isVisible());
        const colors = await status.evaluate((node, done) => {
          const ctx = document.createElement('canvas').getContext('2d');
          const rgb = (color) => {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 1, 1);
            return Array.from(ctx.getImageData(0, 0, 1, 1).data).slice(0, 3);
          };
          const style = getComputedStyle(node);
          return {
            label: node.parentElement.textContent,
            prefix: rgb(getComputedStyle(node.parentElement).color),
            neutral: rgb(style.getPropertyValue('--mp-color-text-secondary')),
            status: rgb(style.color),
            accent: rgb(
              style.getPropertyValue(
                done ? '--mp-color-status-success' : '--mp-color-status-danger',
              ),
            ),
          };
        }, submitted);
        assert.equal(colors.label, `내정보 입력 ${submitted ? '완료' : '미완료'}`);
        assert.deepEqual(colors.prefix, colors.neutral);
        const [red, green] = colors.status;
        assert.ok(submitted ? green > red : red > green);
        assert.ok(Math.abs(red - green) < Math.abs(colors.accent[0] - colors.accent[1]));
      }
      assert.doesNotMatch(await board.innerText(), /이전 상태 문구|다음:/);
      const badgeColors = await board
        .locator('header [data-tone]')
        .evaluateAll((badges) => badges.map((badge) => getComputedStyle(badge).color));
      assert.equal(new Set(badgeColors).size, 6);
    }
    const listToggle = page.getByRole('button', { name: '리스트로 보기' });
    assert.ok(await listToggle.locator('svg').isVisible());
    await listToggle.click();
    await page.getByRole('region', { name: '촬영 목록' }).waitFor();
    await page.getByRole('button', { name: '보드로 보기' }).click();
    await board.waitFor();
  } finally {
    await browser.close();
  }
});
