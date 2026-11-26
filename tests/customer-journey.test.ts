// 고객 상태가 올바른 원본 화면과 행동으로 연결되는지 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveJourney } from '../apps/frontend-customer-page/src/features/customer/journey.ts';

const now = new Date('2026-11-06T03:00:00Z');
const base = {
  startsAt: '2026-11-09T04:00:00Z',
  paymentState: 'confirmed',
  survey: { submittedAt: null, answers: {} },
};

test('pending payment stays before survey and opens the deposit scene', () => {
  const journey = resolveJourney(
    { ...base, status: 'payment_pending', paymentState: 'pending' },
    now,
  );
  assert.equal(journey.state, 'payment');
  assert.equal(journey.scene, 'payment');
  assert.equal(journey.stage, 2);
});

test('unsubmitted survey and submitted preparation use separate customer tasks', () => {
  assert.equal(resolveJourney({ ...base, status: 'survey_pending' }, now).scene, 'survey');
  const submitted = resolveJourney(
    {
      ...base,
      status: 'survey_submitted',
      survey: { submittedAt: '2026-11-05T03:00:00Z', answers: {} },
    },
    now,
  );
  assert.equal(submitted.state, 'preparation');
  assert.equal(submitted.scene, 'preparation');
  assert.equal(submitted.stage, 4);
});

test('sharing a plan early never completes an unsubmitted customer survey', () => {
  for (const status of ['preparing', 'reminder_ready'] as const) {
    const journey = resolveJourney({ ...base, status }, now);
    assert.equal(journey.state, 'survey');
    assert.equal(journey.scene, 'survey');
    assert.equal(journey.stage, 3);
  }
  assert.equal(
    resolveJourney({ ...base, status: 'preparing', startsAt: now.toISOString() }, now).state,
    'survey',
  );
  assert.equal(
    resolveJourney({ ...base, status: 'preparing', paymentState: 'pending' }, now).state,
    'payment',
  );
  assert.equal(resolveJourney({ ...base, status: 'arrived' }, now).state, 'shoot-day');
});

test('shoot-day home begins at Seoul midnight and does not replace completed shooting', () => {
  const shoot = {
    ...base,
    status: 'preparing' as const,
    startsAt: '2026-11-06T04:00:00Z',
    survey: { submittedAt: '2026-11-05T03:00:00Z', answers: {} },
  };
  assert.equal(resolveJourney(shoot, new Date('2026-11-05T14:59:59Z')).state, 'preparation');
  assert.equal(resolveJourney(shoot, new Date('2026-11-05T15:00:00Z')).state, 'shoot-day');
  assert.equal(resolveJourney({ ...shoot, status: 'shoot_complete' }, now).state, 'complete');
});

test('historical photo workflow states display the completed shooting without post-delivery actions', () => {
  for (const status of [
    'selection_pending',
    'selection_complete',
    'retouch_assigned',
    'retouching',
    'delivered',
    'review_pending',
    'originals_delivered',
    'follow_up',
  ] as const) {
    const journey = resolveJourney({ ...base, status }, now);
    assert.deepEqual(journey, { state: 'complete', stage: 5, scene: 'shoot-day' });
  }
});

test('cancelled shoots expose no next business action', () => {
  const journey = resolveJourney({ ...base, status: 'cancelled' }, now);
  assert.equal(journey.state, 'cancelled');
  assert.equal(journey.scene, null);
  assert.equal(journey.stage, 0);
});
