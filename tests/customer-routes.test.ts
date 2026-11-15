// 고객 경로를 제한하고 설문 하위 단계와 직접 진입 시 돌아갈 경로를 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingStep } from '../apps/frontend-customer-page/src/features/booking/routes.ts';
import {
  customerRoute,
  customerPath,
  customerParent,
} from '../apps/frontend-customer-page/src/features/customer/routes.ts';

test('booking routes expose each step and reject unknown nested paths', () => {
  assert.equal(bookingStep('/start'), 1);
  assert.equal(bookingStep('/start/details'), 2);
  assert.equal(bookingStep('/start/schedule/'), 3);
  assert.equal(bookingStep('/start/complete'), 4);
  for (const path of ['/start/unknown', '/start/details/extra', '/start-extra'])
    assert.equal(bookingStep(path), null);
});

test('customer paths validate scene and exact survey page bounds', () => {
  assert.deepEqual(customerRoute([]), { scene: 'home', surveyPage: null });
  assert.deepEqual(customerRoute(['survey', '4']), { scene: 'survey', surveyPage: 4 });
  assert.deepEqual(customerRoute(['preparation']), { scene: 'preparation', surveyPage: null });
  for (const segments of [
    ['unknown'],
    ['survey', '0'],
    ['survey', '5'],
    ['survey', '01'],
    ['survey', '1', 'extra'],
    ['results', '1'],
  ])
    assert.equal(customerRoute(segments), null);
});

test('deep links fall back within their own shoot and encode the token as one segment', () => {
  assert.equal(customerPath('a/b', 'home'), '/s/a%2Fb');
  assert.equal(customerParent('token', 'survey', 3), '/s/token/survey/2');
  assert.equal(customerParent('token', 'survey', 1), '/s/token');
  assert.equal(customerParent('token', 'plan', null), '/s/token/preparation');
  assert.equal(customerParent('token', 'revision', null), '/s/token/results');
  assert.equal(customerParent('token', 'extra-retouch', null), '/s/token/review');
});
