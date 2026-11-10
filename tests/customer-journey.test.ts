// 고객 상태가 올바른 원본 화면과 행동으로 연결되는지 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveJourney } from '../apps/user/src/features/customer/journey.ts';

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

test('shoot-day home begins at Seoul midnight and does not replace completed shooting', () => {
  const shoot = { ...base, status: 'preparing' as const, startsAt: '2026-11-06T04:00:00Z' };
  assert.equal(resolveJourney(shoot, new Date('2026-11-05T14:59:59Z')).state, 'preparation');
  assert.equal(resolveJourney(shoot, new Date('2026-11-05T15:00:00Z')).state, 'shoot-day');
  assert.equal(resolveJourney({ ...shoot, status: 'shoot_complete' }, now).state, 'retouching');
});

test('director selection is read-only and confirmed mode takes precedence over survey preference', () => {
  const shoot = {
    ...base,
    status: 'selection_pending' as const,
    survey: { submittedAt: '2026-11-05T03:00:00Z', answers: { selector: 'director' } },
  };
  assert.equal(resolveJourney(shoot, now).state, 'director-selection');
  assert.equal(resolveJourney(shoot, now).scene, 'selection');
  assert.equal(resolveJourney({ ...shoot, selectionMode: 'customer' }, now).state, 'selection');
  assert.equal(
    resolveJourney({ ...shoot, selectionMode: 'director' }, now).state,
    'director-selection',
  );
});

test('retouch work, delivered results and follow-up never ask for a new base selection', () => {
  for (const status of ['selection_complete', 'retouch_assigned', 'retouching'] as const) {
    assert.equal(resolveJourney({ ...base, status }, now).state, 'retouching');
    assert.equal(resolveJourney({ ...base, status }, now).scene, 'results');
  }
  assert.equal(resolveJourney({ ...base, status: 'delivered' }, now).state, 'results');
  for (const status of [
    'review_requested',
    'review_pending',
    'originals_delivered',
    'follow_up',
  ] as const) {
    const journey = resolveJourney({ ...base, status }, now);
    assert.equal(journey.state, 'follow-up');
    assert.equal(journey.scene, 'review');
    assert.equal(journey.stage, 7);
  }
});

test('cancelled shoots expose no next business action', () => {
  const journey = resolveJourney({ ...base, status: 'cancelled' }, now);
  assert.equal(journey.state, 'cancelled');
  assert.equal(journey.scene, null);
  assert.equal(journey.stage, 0);
});
