// 실제 고객 앱의 URL·뒤로가기·입력 유지·인증 경계를 API 응답만 대체해 확인합니다.
// 실행: CUSTOMER_APP_URL=http://127.0.0.1:3001 node --test tests/customer-navigation.browser.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const appUrl = process.env.CUSTOMER_APP_URL;
const packageFixture = {
  id: 'hybrid',
  name: '하이브리드',
  price: 190000,
  originalPrice: 220000,
  outfits: 2,
  duration: 120,
  retouchCount: 5,
  description: '두 가지 스타일 촬영',
  active: true,
};

function shootFixture() {
  return {
    id: 'navigation-shoot',
    customerName: '테스트 고객',
    packageId: 'hybrid',
    package: packageFixture,
    status: 'preparing',
    stage: 4,
    paymentState: 'confirmed',
    totalAmount: 190000,
    startsAt: '2099-12-20T04:00:00Z',
    addons: [],
    survey: {
      answers: {
        firstImpression: 5,
        age: 30,
        occupation: '개발자',
        style: '캐주얼',
        motivation: '프로필 사진을 바꾸고 싶어요',
        purposes: ['비즈니스'],
        retouchStrength: 50,
        selector: 'customer',
        referral: '네이버 검색',
        reviewParticipation: false,
        safetyRead: true,
      },
      pageDone: [],
      submittedAt: null,
      dueAt: '2099-12-17T04:00:00Z',
    },
    plan: {
      concept: '편안한 캐주얼',
      outfits: '셔츠와 청바지',
      note: '촬영 설계 테스트',
      sharedAt: '2026-11-10T04:00:00Z',
      referenceImages: [],
    },
    preparation: {
      location: { area: '서울', meetingPlace: '카페 앞', mapUrl: null },
      guides: [
        { id: 'confirmation', title: '촬영일 확정 안내', summary: '', readAt: null },
        { id: 'plan', title: '촬영 설계', summary: '설계 확인', readAt: null },
      ],
      confirmedAt: null,
    },
    directorName: '테스트 디렉터',
    uploads: [
      {
        id: 'survey-photo',
        kind: 'survey',
        name: '기존 얼굴 사진',
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
      },
    ],
    photos: [],
    originals: [],
    requests: [],
    fileLinks: [],
    selections: [],
    payments: [],
    retouchJobs: [],
    outfitPhotosRequired: 2,
    outfitDueAt: null,
    holdExpiresAt: null,
    paymentInstructions: null,
  };
}

async function mockApi(page) {
  const shoot = shootFixture();
  const requests = {
    authentication: [],
    bookings: [],
    actions: [],
    shootReads: 0,
    shoot,
    pendingSave: null,
  };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data;
    if (path === '/api/catalog') {
      data = { packages: [packageFixture], addons: [], retouchUnitPrice: 10000 };
    } else if (path === '/api/calendar') {
      data = { days: [{ date: '2099-12-20', slots: [{ time: '13:00', available: true }] }] };
    } else if (path === '/api/start') {
      requests.bookings.push(route.request().postDataJSON());
      data = { message: '예약 확인을 기다려주세요.' };
    } else if (path === '/api/auth/customer') {
      requests.authentication.push(route.request().postDataJSON());
      data = { shootId: shoot.id, actor: { kind: 'customer', shootId: shoot.id } };
    } else if (path === `/api/shoots/${shoot.id}`) {
      requests.shootReads += 1;
      data = shoot;
    } else if (path === `/api/shoots/${shoot.id}/actions`) {
      const body = route.request().postDataJSON();
      requests.actions.push(body);
      if (body.type === 'save_survey') {
        if (requests.pendingSave) await requests.pendingSave;
        shoot.survey.answers = body.answers;
        shoot.survey.pageDone = body.pageDone;
        if (body.submit) shoot.survey.submittedAt = new Date().toISOString();
      } else if (body.type === 'mark_preparation_read') {
        shoot.preparation.guides.find((guide) => guide.id === body.guideId).readAt =
          new Date().toISOString();
      }
      data = shoot;
    } else {
      return route.fulfill({
        status: 404,
        json: { error: { code: 'NOT_FOUND', message: `Unexpected mock API: ${path}` } },
      });
    }
    await route.fulfill({ json: { data } });
  });
  return requests;
}

async function expectPath(page, path) {
  await page.waitForURL((url) => url.pathname === path);
  assert.equal(new URL(page.url()).pathname, path);
}

async function signIn(page) {
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: '휴대전화 뒤 4자리' }).fill('1234');
  await page.getByRole('button', { name: '나의 촬영 확인', exact: true }).click();
}

async function fillBookingDetails(page) {
  await page.getByRole('textbox', { name: '이름', exact: true }).fill('예약 테스트');
  await page.getByRole('textbox', { name: '휴대폰 번호' }).fill('01012345678');
  await page.getByRole('checkbox', { name: /개인정보 수집·이용 동의/ }).check();
  await page.getByRole('checkbox', { name: /촬영 안내 알림 수신 동의/ }).check();
}

test(
  'customer app preserves route history, forms and authenticated deep links',
  { skip: !appUrl && 'Set CUSTOMER_APP_URL to a running customer app', timeout: 180000 },
  async (suite) => {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
      new URL('../.local/playwright', import.meta.url),
    );
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const screenshots = fileURLToPath(new URL('../.local/customer-navigation/', import.meta.url));
    await mkdir(screenshots, { recursive: true });

    async function scenario(name, run, viewport = { width: 390, height: 844 }) {
      await suite.test(name, async () => {
        const context = await browser.newContext({ viewport });
        const page = await context.newPage();
        page.setDefaultTimeout(15000);
        page.setDefaultNavigationTimeout(30000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const requests = await mockApi(page);
        try {
          await run(page, requests);
          assert.deepEqual(errors, [], 'Customer app must not throw browser errors');
        } catch (error) {
          console.error({ scenario: name, url: page.url(), browserErrors: errors });
          throw error;
        } finally {
          await context.close();
        }
      });
    }

    try {
      await scenario(
        'booking consent labels and previous/next routes retain entered details',
        async (page) => {
          await page.goto(`${appUrl}/start`);
          await page.getByRole('button', { name: '다음: 기본정보 남기기' }).click();
          await expectPath(page, '/start/details');
          for (const label of [
            '개인정보 수집·이용 동의 (필수)',
            '촬영 안내 알림 수신 동의 (카카오톡) (필수)',
            '마케팅 정보 수신 동의 (선택)',
          ]) {
            await page.getByText(label, { exact: true }).waitFor();
          }
          for (const width of [390, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.screenshot({
              path: `${screenshots}/booking-details-${width}.png`,
              fullPage: true,
            });
            assert.equal(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
              true,
            );
          }
          await page.setViewportSize({ width: 390, height: 844 });
          await fillBookingDetails(page);
          await page.getByRole('button', { name: '다음: 촬영 날짜 고르기' }).click();
          await expectPath(page, '/start/schedule');
          await page.goBack();
          await expectPath(page, '/start/details');
          assert.equal(
            await page.getByRole('textbox', { name: '이름', exact: true }).inputValue(),
            '예약 테스트',
          );
          assert.equal(
            await page.getByRole('checkbox', { name: /개인정보 수집·이용 동의/ }).isChecked(),
            true,
          );
          await page.goForward();
          await expectPath(page, '/start/schedule');
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/start/details');
          assert.equal(
            await page.getByRole('textbox', { name: '휴대폰 번호' }).inputValue(),
            '01012345678',
          );
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/start');
          await page.goForward();
          await expectPath(page, '/start/details');
          assert.equal(
            await page.getByRole('textbox', { name: '이름', exact: true }).inputValue(),
            '예약 테스트',
          );
          assert.equal(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            true,
          );
        },
      );

      await scenario(
        'completed bookings cannot be resubmitted through browser history',
        async (page, requests) => {
          await page.goto(`${appUrl}/start`);
          await page.getByRole('button', { name: '다음: 기본정보 남기기' }).click();
          await fillBookingDetails(page);
          await page.getByRole('button', { name: '다음: 촬영 날짜 고르기' }).click();
          await page.getByRole('button', { name: /2099년 12월 20일 예약 가능/ }).click();
          await page.getByRole('button', { name: '13:00', exact: true }).click();
          await page.getByRole('button', { name: '이 시간으로 예약하기' }).click();
          await expectPath(page, '/start/complete');
          await page.getByRole('heading', { name: '예약 요청을 접수했어요' }).waitFor();
          assert.equal(requests.bookings.length, 1);
          await page.goBack();
          await expectPath(page, '/start/complete');
          assert.equal(await page.getByRole('button', { name: '이 시간으로 예약하기' }).count(), 0);
          assert.equal(requests.bookings.length, 1);
        },
        { width: 1280, height: 900 },
      );

      await scenario(
        'fresh booking deep links require details and a real completion result',
        async (page) => {
          await page.goto(`${appUrl}/start/schedule`);
          await expectPath(page, '/start/details');
          await page.getByRole('textbox', { name: '이름', exact: true }).waitFor();
          await page.goto(`${appUrl}/start/complete`);
          await expectPath(page, '/start');
          await page.getByRole('heading', { name: '촬영 옵션을 골라주세요' }).waitFor();
        },
      );

      await scenario(
        'customer payment and preparation paths support browser and app bar back',
        async (page) => {
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          const journey = page.getByRole('navigation', { name: '나의 촬영 여정' });
          await journey.getByRole('button', { name: /촬영 일정 선택/ }).click();
          await expectPath(page, '/s/demo-token/payment');
          await page.getByRole('textbox', { name: '입금자명' }).waitFor();
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/s/demo-token');
          await page.goForward();
          await expectPath(page, '/s/demo-token/payment');
          await page.goBack();
          await expectPath(page, '/s/demo-token');
          await page.getByRole('button', { name: '준비 안내 이어서 보기' }).click();
          await expectPath(page, '/s/demo-token/preparation');
          await page.getByRole('button', { name: /촬영 설계/ }).click();
          await expectPath(page, '/s/demo-token/plan');
          await page.getByRole('heading', { name: '디렉터가 촬영을 설계했어요' }).waitFor();
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/s/demo-token/preparation');
          await page.goBack();
          await expectPath(page, '/s/demo-token');
        },
      );

      await scenario(
        'survey pages keep answers across back and forward navigation',
        async (page) => {
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page
            .getByRole('navigation', { name: '나의 촬영 여정' })
            .getByRole('button', { name: /설문 작성/ })
            .click();
          await expectPath(page, '/s/demo-token/survey/1');
          await page.getByRole('textbox', { name: '직업' }).fill('입력 유지 테스트');
          await page.getByRole('button', { name: '다음', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/2');
          await page.getByRole('spinbutton', { name: '키 (cm)' }).fill('181');
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/1');
          assert.equal(
            await page.getByRole('textbox', { name: '직업' }).inputValue(),
            '입력 유지 테스트',
          );
          await page.goForward();
          await expectPath(page, '/s/demo-token/survey/2');
          assert.equal(await page.getByRole('spinbutton', { name: '키 (cm)' }).inputValue(), '181');
          await page.getByRole('button', { name: '다음', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/3');
          await page.getByRole('button', { name: '다음', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/4');
          await page.goBack();
          await expectPath(page, '/s/demo-token/survey/3');
          await page.getByRole('textbox', { name: '촬영하게 된 계기를 알려주세요' }).waitFor();
        },
      );

      await scenario(
        'survey deep links authenticate first and retain the requested page',
        async (page, requests) => {
          await page.goto(`${appUrl}/s/demo-token/survey/2`);
          await page.getByRole('heading', { name: '고객님이 맞으신가요?' }).waitFor();
          assert.equal(requests.shootReads, 0);
          assert.equal(
            await page.getByRole('heading', { name: '어떤 스타일을 좋아하세요?' }).count(),
            0,
          );
          await signIn(page);
          await page.getByRole('heading', { name: '어떤 스타일을 좋아하세요?' }).waitFor();
          await expectPath(page, '/s/demo-token/survey/2');
          assert.deepEqual(requests.authentication, [{ token: 'demo-token', last4: '1234' }]);
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/1');
          await page.getByRole('heading', { name: '먼저 고객님을 알려주세요' }).waitFor();
        },
      );

      await scenario(
        'resumed survey previous button opens the previous question page',
        async (page, requests) => {
          requests.shoot.survey.pageDone = [1, 2];
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page
            .getByRole('navigation', { name: '나의 촬영 여정' })
            .getByRole('button', { name: /설문 작성/ })
            .click();
          await expectPath(page, '/s/demo-token/survey/3');
          await page.getByRole('button', { name: '이전', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/2');
          await page.getByRole('heading', { name: '어떤 스타일을 좋아하세요?' }).waitFor();
        },
      );

      await scenario(
        'leaving survey immediately keeps edits that have not autosaved yet',
        async (page) => {
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          const survey = page
            .getByRole('navigation', { name: '나의 촬영 여정' })
            .getByRole('button', { name: /설문 작성/ });
          await survey.click();
          await expectPath(page, '/s/demo-token/survey/1');
          await page.getByRole('textbox', { name: '직업' }).fill('아직 자동 저장 전인 입력');
          await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
          await expectPath(page, '/s/demo-token');
          await survey.click();
          await expectPath(page, '/s/demo-token/survey/1');
          assert.equal(
            await page.getByRole('textbox', { name: '직업' }).inputValue(),
            '아직 자동 저장 전인 입력',
          );
        },
      );

      await scenario(
        'a delayed survey save cannot navigate forward after going back',
        async (page, requests) => {
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page
            .getByRole('navigation', { name: '나의 촬영 여정' })
            .getByRole('button', { name: /설문 작성/ })
            .click();
          await expectPath(page, '/s/demo-token/survey/1');
          let releaseSave;
          requests.pendingSave = new Promise((resolve) => {
            releaseSave = resolve;
          });
          try {
            const saving = page.waitForRequest((request) => request.url().endsWith('/actions'));
            await page.getByRole('button', { name: '다음', exact: true }).click();
            await saving;
            await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
            await expectPath(page, '/s/demo-token');
            const saved = page.waitForResponse((response) => response.url().endsWith('/actions'));
            releaseSave();
            await saved;
            await page.waitForLoadState('networkidle');
            await expectPath(page, '/s/demo-token');
            await page.getByRole('navigation', { name: '나의 촬영 여정' }).waitFor();
          } finally {
            releaseSave();
          }
        },
      );

      await scenario(
        'an unsubmitted survey cannot show a completion screen from a direct URL',
        async (page, requests) => {
          requests.shoot.survey.pageDone = [1, 2];
          await page.goto(`${appUrl}/s/demo-token/survey-complete`);
          await signIn(page);
          await expectPath(page, '/s/demo-token/survey/3');
          await page.getByRole('heading', { name: '어떤 사진이 필요하세요?' }).waitFor();
          assert.equal(await page.getByRole('heading', { name: '설문 제출 완료!' }).count(), 0);
        },
      );

      await scenario('unknown booking and customer subpaths return 404', async (page, requests) => {
        for (const path of [
          '/start/missing-step',
          '/s/demo-token/missing-scene',
          '/s/demo-token/survey/5',
        ]) {
          const response = await page.goto(`${appUrl}${path}`);
          assert.equal(response.status(), 404, path);
        }
        assert.equal(requests.shootReads, 0);
        assert.deepEqual(requests.authentication, []);
      });
    } finally {
      await browser.close();
    }
  },
);
