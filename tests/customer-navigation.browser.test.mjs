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
    retouchUnitPrice: 10000,
    extraRetouchAvailable: true,
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
    bookingResult: { accepted: true, message: '예약 확인을 기다려주세요.' },
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
      data = requests.bookingResult;
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
      } else if (body.type === 'request_deposit') {
        shoot.requests.push({ id: 'deposit-request', type: 'deposit', state: 'new' });
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
  { skip: !appUrl && 'Set CUSTOMER_APP_URL to a running customer app', timeout: 300000 },
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
        'package labels, BEST and selection controls have separate space',
        async (page) => {
          await page.goto(`${appUrl}/start`);
          const packages = page.getByRole('group', { name: '패키지', exact: true });
          const radio = packages.getByRole('radio', { checked: true });
          await radio.waitFor();
          await page.evaluate(() => document.fonts.ready);
          for (const width of [320, 390, 1440]) {
            await page.setViewportSize({ width, height: 844 });
            const brand = await page
              .getByRole('link', { name: 'MANSPICK', exact: true })
              .boundingBox();
            const shellLeft = Math.max(0, (width - 480) / 2);
            assert.equal(brand?.x, shellLeft + (width <= 360 ? 16 : 24));
            if (width === 390) {
              const track = await page
                .getByRole('progressbar', { name: '촬영 옵션 선택' })
                .boundingBox();
              assert.deepEqual(track, { x: 24, y: 96, width: 342, height: 4 });
            }
            const box = await radio.boundingBox();
            assert.ok(
              box && box.width <= 22 && box.height <= 22 && box.width === box.height,
              `Expected a round selection control at ${width}px; got ${JSON.stringify(box)}`,
            );
            const [title, badge] = await packages.evaluate((group) => {
              const nodes = document.createTreeWalker(group, NodeFilter.SHOW_TEXT);
              const texts = new Map();
              while (nodes.nextNode()) {
                const range = document.createRange();
                range.selectNodeContents(nodes.currentNode);
                texts.set(
                  nodes.currentNode.textContent.trim(),
                  range.getBoundingClientRect().toJSON(),
                );
              }
              return [texts.get('하이브리드'), texts.get('BEST')];
            });
            assert.ok(
              title &&
                badge &&
                title.right < badge.left &&
                title.top < badge.bottom &&
                badge.top < title.bottom,
              `Expected BEST beside the package title at ${width}px`,
            );
            assert.ok(box.x + box.width < title.left, 'The radio must clear the package name');
          }
        },
      );

      await scenario(
        'booking consent labels and previous/next routes retain entered details',
        async (page) => {
          await page.goto(`${appUrl}/start`);
          await page.getByRole('button', { name: '다음: 기본정보 입력' }).click();
          await expectPath(page, '/start/details');
          for (const [label, required] of [
            [/개인정보 수집·이용 동의.*필수/, true],
            [/촬영 안내 알림 수신 동의 \(카카오톡\).*필수/, true],
            [/마케팅 정보 수신 동의.*선택/, false],
          ]) {
            const checkbox = page.getByRole('checkbox', { name: label });
            await checkbox.waitFor();
            assert.equal(await checkbox.evaluate((input) => input.required), required);
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
          await page.getByRole('button', { name: '다음: 기본정보 입력' }).click();
          await fillBookingDetails(page);
          await page.getByRole('button', { name: '다음: 촬영 날짜 고르기' }).click();
          await page.getByRole('button', { name: /2099년 12월 20일 예약 가능/ }).click();
          await page.getByRole('button', { name: '13:00', exact: true }).click();
          await page.getByRole('button', { name: '이 시간으로 예약하기' }).click();
          await expectPath(page, '/start/complete');
          await page.getByRole('heading', { name: '예약 요청을 접수했어요' }).waitFor();
          await page.getByText(/이미 안내받은 개인 촬영 링크가 있다면/).waitFor();
          assert.equal(
            await page.getByRole('link', { name: '입금 안내 확인하고 계속하기' }).count(),
            0,
          );
          assert.equal(requests.bookings.length, 1);
          await page.goBack();
          await expectPath(page, '/start/complete');
          assert.equal(await page.getByRole('button', { name: '이 시간으로 예약하기' }).count(), 0);
          assert.equal(requests.bookings.length, 1);
        },
        { width: 1280, height: 900 },
      );

      for (const access of ['public-test', 'local']) {
        await scenario(
          `${access} booking completion connects to payment authentication and survey`,
          async (page, requests) => {
            requests.bookingResult = {
              accepted: true,
              message: '예약 확인을 기다려주세요.',
              ...(access === 'local'
                ? {
                    localAccess: {
                      token: 'new-booking-token',
                      last4: '1234',
                      shootId: requests.shoot.id,
                    },
                  }
                : { bookingAccess: { token: 'new-booking-token' } }),
            };
            Object.assign(requests.shoot, {
              status: 'payment_pending',
              stage: 2,
              paymentState: 'pending',
            });
            await page.goto(`${appUrl}/start`);
            await page.getByRole('button', { name: '다음: 기본정보 입력' }).click();
            await fillBookingDetails(page);
            await page.getByRole('button', { name: '다음: 촬영 날짜 고르기' }).click();
            await page.getByRole('button', { name: /2099년 12월 20일 예약 가능/ }).click();
            await page.getByRole('button', { name: '13:00', exact: true }).click();
            await page.getByRole('button', { name: '이 시간으로 예약하기' }).click();
            await expectPath(page, '/start/complete');
            await page.getByText('입금 확인이 끝나면 설문을 작성할 수 있어요.').waitFor();
            assert.equal(await page.getByText(/확인 번호:/).count(), access === 'local' ? 1 : 0);
            const continueLink = page.getByRole('link', { name: '입금 안내 확인하고 계속하기' });
            assert.equal(await continueLink.getAttribute('href'), '/s/new-booking-token/payment');
            await page.screenshot({
              path: `${screenshots}/booking-complete-${access}.png`,
              fullPage: true,
            });
            await continueLink.click();
            await expectPath(page, '/s/new-booking-token/payment');
            await page.getByRole('heading', { name: '고객님이 맞으신가요?' }).waitFor();
            assert.equal(await page.getByRole('button', { name: '입금했어요' }).count(), 0);
            await signIn(page);
            assert.equal(requests.authentication.at(-1).token, 'new-booking-token');
            await page.getByRole('button', { name: '입금했어요', exact: true }).click();
            await page.getByRole('heading', { name: '입금 확인을 기다리고 있어요' }).waitFor();
            assert.equal(requests.shoot.paymentState, 'pending');
            assert.equal(
              await page.getByRole('button', { name: '설문 작성하기', exact: true }).count(),
              0,
            );
            assert.equal(
              requests.actions.some((action) => action.type === 'save_survey'),
              false,
            );
            Object.assign(requests.shoot, {
              status: 'survey_pending',
              stage: 3,
              paymentState: 'confirmed',
            });
            await page.getByRole('button', { name: '입금 확인 상태 새로고침' }).click();
            await page.getByRole('heading', { name: '예약이 확정됐어요' }).waitFor();
            await page.getByRole('button', { name: '설문 작성하기', exact: true }).click();
            await expectPath(page, '/s/new-booking-token/survey/1');
            await page.getByRole('heading', { name: '먼저 고객님을 알려주세요' }).waitFor();
            assert.equal(requests.bookings.length, 1);
          },
        );
      }

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
        'preparation date keeps its card typography in the rendered route',
        async (page) => {
          await page.goto(`${appUrl}/s/demo-token/preparation`);
          await signIn(page);
          await page.getByRole('heading', { name: '촬영 전 확인할 안내' }).waitFor();
          const date = page.locator('main h1');
          const [rendered, cardSize] = await date.evaluate((heading) => {
            const style = getComputedStyle(heading);
            return [style.fontSize, style.getPropertyValue('--mp-type-h2-size').trim()];
          });
          assert.equal(rendered, cardSize, 'The page heading style must not enlarge the date card');
        },
      );

      await scenario(
        'a full candidate gallery keeps the last photo selectable and resets when filtered',
        async (page, { shoot }) => {
          shoot.status = 'selection_pending';
          shoot.stage = 6;
          shoot.photos = Array.from({ length: 42 }, (_, index) => ({
            id: `candidate-${index + 1}`,
            cutNo: index + 1,
            kind: 'candidate',
            outfitNo: index < 22 ? 1 : 2,
            url: shoot.uploads[0].url,
          }));
          await page.goto(`${appUrl}/s/demo-token/selection`);
          await signIn(page);
          const gallery = page.getByRole('region', { name: '촬영 후보 사진' });
          await gallery.waitFor();
          assert.equal(await gallery.getByRole('button').count(), 42);
          const [first, second, fourth] = await Promise.all(
            [0, 1, 3].map((index) => gallery.getByRole('button').nth(index).boundingBox()),
          );
          assert.ok(first && second && fourth);
          assert.deepEqual([first.width, first.height], [112, 140]);
          assert.equal(second.x - first.x - first.width, 3);
          assert.equal(fourth.y - first.y - first.height, 3);
          assert.ok(await gallery.evaluate((el) => el.scrollHeight > el.clientHeight * 2));
          const last = gallery.getByRole('button', { name: /촬영 후보 42번$/ });
          await last.click();
          assert.equal(await last.getAttribute('aria-pressed'), 'true');
          assert.ok(await gallery.evaluate((el) => el.scrollTop > 0));
          await page.getByRole('button', { name: '의상 1 22', exact: true }).click();
          assert.equal(await gallery.getByRole('button').count(), 22);
          assert.equal(await gallery.evaluate((el) => el.scrollTop), 0);
          await page.getByRole('button', { name: '전체 42', exact: true }).click();
          assert.equal(await last.getAttribute('aria-pressed'), 'true');
        },
      );

      await scenario(
        'customer payment and preparation paths support browser and app bar back',
        async (page, requests) => {
          requests.shoot.survey.submittedAt = '2026-11-16T03:00:00Z';
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          const journey = page.getByRole('navigation', { name: '나의 촬영 여정' });
          await journey.getByRole('button', { name: /촬영 일정 선택/ }).click();
          await expectPath(page, '/s/demo-token/payment');
          await page.getByRole('heading', { name: '예약이 확정됐어요' }).waitFor();
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

      await scenario(
        'payment confirmation continues through all survey pages to the progress home',
        async (page, requests) => {
          Object.assign(requests.shoot, {
            status: 'payment_pending',
            stage: 2,
            paymentState: 'pending',
            holdExpiresAt: '2099-12-18T04:00:00Z',
          });
          await page.goto(`${appUrl}/s/demo-token/payment`);
          await signIn(page);
          await page.getByRole('button', { name: '입금했어요', exact: true }).click();
          await page.getByRole('heading', { name: '입금 확인을 기다리고 있어요' }).waitFor();
          assert.equal(requests.shoot.paymentState, 'pending');
          assert.equal(
            await page.getByRole('button', { name: '설문 작성하기', exact: true }).count(),
            0,
          );
          Object.assign(requests.shoot, {
            paymentState: 'confirmed',
            status: 'survey_pending',
            stage: 3,
          });
          await page.getByRole('button', { name: '입금 확인 상태 새로고침' }).click();
          await page.getByRole('heading', { name: '예약이 확정됐어요' }).waitFor();
          assert.equal(await page.getByRole('textbox', { name: '입금자명' }).count(), 0);
          assert.equal(await page.getByText(/남음|기한이 지나면/).count(), 0);
          await page.screenshot({ path: `${screenshots}/payment-confirmed.png`, fullPage: true });
          await page.getByRole('button', { name: '설문 작성하기', exact: true }).click();
          for (let number = 1; number <= 4; number += 1) {
            await expectPath(page, `/s/demo-token/survey/${number}`);
            if (number === 2) {
              const previous = await page
                .getByRole('button', { name: '이전', exact: true })
                .boundingBox();
              const next = await page
                .getByRole('button', { name: '다음', exact: true })
                .boundingBox();
              assert.ok(previous && next);
              assert.equal(previous.width, 100);
              assert.equal(next.x - previous.x - previous.width, 8);
            }
            if (number === 4) {
              await page.getByRole('checkbox', { name: '주의사항을 모두 확인했어요' }).uncheck();
              await page.getByRole('checkbox', { name: '주의사항을 모두 확인했어요' }).check();
              await page.screenshot({ path: `${screenshots}/survey-4-bottom-390.png` });
              await page.evaluate(() => window.scrollTo(0, 0));
            }
            for (const width of [390, 1440]) {
              await page.setViewportSize({ width, height: 900 });
              await page.screenshot({
                path: `${screenshots}/survey-${number}-${width}.png`,
                fullPage: true,
              });
              assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                true,
              );
            }
            await page.setViewportSize({ width: 390, height: 844 });
            await page
              .getByRole('button', { name: number === 4 ? '설문 제출하기' : '다음', exact: true })
              .click();
          }
          await expectPath(page, '/s/demo-token/survey-complete');
          assert.equal(
            requests.actions.filter((action) => action.type === 'save_survey' && action.submit)
              .length,
            1,
          );
          assert.equal(requests.shoot.survey.answers.reviewParticipation, false);
          await page.getByRole('button', { name: '나의 촬영 홈으로', exact: true }).click();
          await expectPath(page, '/s/demo-token');
          await page.getByRole('button', { name: '준비 안내 이어서 보기' }).waitFor();
        },
      );

      await scenario(
        'payment screen receives staff confirmation without a page reload',
        async (page, requests) => {
          Object.assign(requests.shoot, {
            status: 'payment_pending',
            stage: 2,
            paymentState: 'pending',
          });
          await page.goto(`${appUrl}/s/demo-token/payment`);
          await signIn(page);
          await page.getByRole('textbox', { name: '입금자명' }).waitFor();
          Object.assign(requests.shoot, {
            paymentState: 'confirmed',
            status: 'survey_pending',
            stage: 3,
          });
          await page
            .getByRole('button', { name: '설문 작성하기', exact: true })
            .waitFor({ timeout: 22000 });
          assert.ok(requests.shootReads >= 2);
        },
      );

      await scenario(
        'final survey submission returns to an invalid earlier page',
        async (page, requests) => {
          requests.shoot.survey.pageDone = [1, 2, 3];
          requests.shoot.survey.answers.purposes = [];
          await page.goto(`${appUrl}/s/demo-token/survey/4`);
          await signIn(page);
          await page.getByRole('button', { name: '설문 제출하기' }).click();
          await expectPath(page, '/s/demo-token/survey/3');
          await page
            .getByRole('alert')
            .getByText('사진을 사용할 곳을 한 가지 이상 선택해주세요.')
            .waitFor();
          assert.equal(
            requests.actions.some((action) => action.submit),
            false,
          );
          await page.getByRole('checkbox', { name: '비즈니스 프로필' }).check();
          await page.getByRole('button', { name: '다음', exact: true }).click();
          await page.getByRole('button', { name: '설문 제출하기' }).click();
          await expectPath(page, '/s/demo-token/survey-complete');
        },
      );

      await scenario(
        'survey completion after shooting offers home instead of unavailable editing',
        async (page, requests) => {
          Object.assign(requests.shoot, { status: 'retouching', stage: 6 });
          requests.shoot.survey.submittedAt = '2026-11-16T03:00:00Z';
          await page.goto(`${appUrl}/s/demo-token/survey-complete`);
          await signIn(page);
          await page.getByRole('heading', { name: '설문 제출 완료!' }).waitFor();
          assert.equal(await page.getByRole('button', { name: '제출한 내용 수정하기' }).count(), 0);
          await page.getByRole('button', { name: '나의 촬영 홈으로', exact: true }).click();
          await expectPath(page, '/s/demo-token');
        },
      );

      await scenario(
        'home refresh synchronizes an untouched survey before resuming',
        async (page, requests) => {
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page.getByRole('navigation', { name: '나의 촬영 여정' }).waitFor();
          requests.shoot.survey.answers.occupation = '다른 탭에서 저장한 직업';
          const refreshed = page.waitForResponse((response) =>
            response.url().endsWith(`/shoots/${requests.shoot.id}`),
          );
          await page.evaluate(() => window.dispatchEvent(new Event('focus')));
          await refreshed;
          await page.getByRole('button', { name: '설문 이어서 작성하기', exact: true }).click();
          await expectPath(page, '/s/demo-token/survey/1');
          assert.equal(
            await page.getByRole('textbox', { name: '직업' }).inputValue(),
            '다른 탭에서 저장한 직업',
          );
        },
      );

      await scenario(
        'bank transfer home shows the reserved time, account and deposit amount',
        async (page, requests) => {
          Object.assign(requests.shoot, {
            status: 'payment_pending',
            stage: 2,
            paymentState: 'pending',
            paymentInstructions: {
              bankName: '테스트은행',
              accountNumber: '000-123',
              accountHolder: '테스트',
            },
          });
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page
            .getByRole('heading', { name: '테스트 고객님, 입금하면 예약이 확정돼요' })
            .waitFor();
          await page.getByText(/테스트은행 000-123 · 190,000원/).waitFor();
          await page.getByText(/13:00 – 15:00/).waitFor();
          await page.getByRole('button', { name: '입금 안내 보기' }).click();
          await expectPath(page, '/s/demo-token/payment');
          await page.getByRole('button', { name: '입금했어요' }).waitFor();
        },
      );

      await scenario(
        'prepaid platform customers see staff verification without a bank transfer request',
        async (page, requests) => {
          Object.assign(requests.shoot, {
            status: 'payment_pending',
            stage: 2,
            paymentState: 'pending',
            payments: [{ kind: 'base', channel: 'smartstore', state: 'pending' }],
          });
          await page.goto(`${appUrl}/s/demo-token`);
          await signIn(page);
          await page.getByText('스마트스토어에서 결제하신 내역을 확인하고 있어요.').waitFor();
          await page.getByRole('button', { name: '확인 상태 보기' }).click();
          await page.getByRole('heading', { name: '결제 확인을 기다리고 있어요' }).waitFor();
          assert.equal(await page.getByRole('textbox', { name: '입금자명' }).count(), 0);
          assert.equal(await page.getByRole('button', { name: '입금했어요' }).count(), 0);
        },
      );

      await scenario(
        'a shared plan opens the outfit uploader even without an outfit guide',
        async (page) => {
          await page.goto(`${appUrl}/s/demo-token/plan`);
          await signIn(page);
          await page.getByRole('button', { name: '의상 사진 올리기' }).click();
          const dialog = page.getByRole('dialog', { name: /의상/ });
          await dialog.waitFor();
          assert.equal(await dialog.locator('input[type=file]').count(), 1);
          await dialog.getByRole('button', { name: '확인', exact: true }).click();
          await dialog.waitFor({ state: 'hidden' });
          await expectPath(page, '/s/demo-token/preparation');
        },
      );

      for (const [state, cta] of [
        ['partial-survey', '설문 이어서 작성하기'],
        ['prepared', '준비 안내 다시 보기'],
        ['outfits-missing', '의상 사진 올리기'],
        ['review-pending', '후기 진행상태 보기'],
        ['review-approved', '원본 전달 상태 보기'],
        ['review-rejected', '후기 다시 확인하기'],
        ['originals-ready', '원본 사진 확인하기'],
      ]) {
        await scenario(
          `progress home shows the actual next action: ${state}`,
          async (page, requests) => {
            const shoot = requests.shoot;
            if (state === 'partial-survey') {
              shoot.survey.pageDone = [1, 2];
            } else {
              shoot.survey.submittedAt = '2026-11-16T03:00:00Z';
              if (state === 'prepared' || state === 'outfits-missing') {
                shoot.preparation.confirmedAt = '2026-11-16T04:00:00Z';
                if (state === 'prepared') shoot.outfitPhotosRequired = 0;
              } else {
                Object.assign(shoot, { status: 'review_pending', stage: 7 });
                shoot.requests = [
                  {
                    id: 'review',
                    type: 'review',
                    state:
                      state === 'review-approved'
                        ? 'complete'
                        : state === 'review-rejected'
                          ? 'rejected'
                          : 'new',
                  },
                ];
                if (state === 'originals-ready')
                  shoot.fileLinks = [
                    { kind: 'original', url: 'https://example.com/originals', label: '원본' },
                  ];
              }
            }
            await page.goto(`${appUrl}/s/demo-token`);
            await signIn(page);
            await page.getByRole('button', { name: cta, exact: true }).waitFor();
            for (const width of [320, 390, 1440]) {
              await page.setViewportSize({ width, height: 900 });
              assert.equal(
                await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
                true,
              );
              await page.screenshot({
                path: `${screenshots}/home-${state}-${width}.png`,
                fullPage: true,
              });
            }
            await page.getByRole('button', { name: cta, exact: true }).click();
            await expectPath(
              page,
              state === 'partial-survey'
                ? '/s/demo-token/survey/3'
                : state === 'prepared' || state === 'outfits-missing'
                  ? '/s/demo-token/preparation'
                  : '/s/demo-token/review',
            );
            if (state === 'outfits-missing') {
              await page.getByRole('dialog', { name: /의상/ }).waitFor();
            }
            if (state === 'review-approved') {
              await page.getByRole('button', { name: '제출한 후기 보기' }).click();
              const dialog = page.getByRole('dialog', { name: '제출한 후기' });
              await dialog.getByText(/후기가 확인됐어요/).waitFor();
              assert.equal(await dialog.locator('input[type=file]').count(), 0);
            }
          },
        );
      }

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
