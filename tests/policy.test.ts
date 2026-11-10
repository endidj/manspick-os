// 운영 정책이 신규 예약 범위·입금 잠금·기존 슬롯 점유와 마감 계산에 실제 적용되는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_OPERATIONS_POLICY,
  validateOperationsPolicy,
} from '../packages/domain/src/operations-policy.ts';
import { holdExpiry, requiredSlots, validateBookingDate } from '../packages/domain/src/booking.ts';
import { deadline } from '../packages/domain/src/preparation.ts';
import { operationsPolicy } from '../apps/server/src/settings/operations-policy.ts';
import type { Env } from '../apps/server/src/runtime/env.ts';

test('policy defaults preserve original booking, hold and deadline values', () => {
  assert.deepEqual(validateOperationsPolicy(DEFAULT_OPERATIONS_POLICY), {
    holdHours: 24,
    holdCutoffHours: 2,
    bookingHorizonWeeks: 8,
    slotTimes: ['11:00', '13:00', '15:00', '17:00'],
    surveyLeadDays: 3,
    outfitLeadDays: 2,
  });
  const now = new Date('2026-11-01T00:00:00Z');
  const starts = new Date('2026-11-14T11:00:00+09:00');
  assert.equal(holdExpiry(now, starts), '2026-11-02T00:00:00.000Z');
  assert.deepEqual(requiredSlots('allday', '11:00', false), ['11:00', '13:00', '15:00', '17:00']);
  assert.equal(
    deadline(starts.toISOString(), DEFAULT_OPERATIONS_POLICY.surveyLeadDays, now),
    '2026-11-11T11:00:00.000Z',
  );
  assert.equal(
    deadline(starts.toISOString(), DEFAULT_OPERATIONS_POLICY.outfitLeadDays, now),
    '2026-11-12T11:00:00.000Z',
  );
});

test('policy rejects unsafe values and arbitrary new slot times while normalizing canonical subsets', () => {
  for (const invalid of [
    null,
    [],
    {},
    { ...DEFAULT_OPERATIONS_POLICY, holdHours: 0 },
    { ...DEFAULT_OPERATIONS_POLICY, holdHours: '24' },
    { ...DEFAULT_OPERATIONS_POLICY, holdCutoffHours: 25 },
    { ...DEFAULT_OPERATIONS_POLICY, bookingHorizonWeeks: 53 },
    { ...DEFAULT_OPERATIONS_POLICY, surveyLeadDays: 0 },
    { ...DEFAULT_OPERATIONS_POLICY, outfitLeadDays: 1.5 },
    { ...DEFAULT_OPERATIONS_POLICY, slotTimes: [] },
    { ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['11:00', '11:00'] },
    { ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['10:00'] },
  ])
    assert.throws(() => validateOperationsPolicy(invalid));
  assert.deepEqual(
    validateOperationsPolicy({ ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['17:00', '11:00'] })
      .slotTimes,
    ['11:00', '17:00'],
  );
});

test('custom hold hours and cutoff govern new reservations', () => {
  const now = new Date('2026-11-06T00:00:00Z');
  const policy = { ...DEFAULT_OPERATIONS_POLICY, holdHours: 6, holdCutoffHours: 3 };
  assert.equal(
    holdExpiry(now, new Date('2026-11-10T02:00:00Z'), policy),
    '2026-11-06T06:00:00.000Z',
  );
  assert.equal(
    holdExpiry(now, new Date('2026-11-06T08:00:00Z'), policy),
    '2026-11-06T05:00:00.000Z',
  );
  assert.throws(() => holdExpiry(now, new Date('2026-11-06T03:00:00Z'), policy));
});

test('shorter horizon is inclusive from Seoul tomorrow and keeps same-day booking closed', () => {
  const now = new Date('2026-11-05T15:30:00Z');
  const policy = { ...DEFAULT_OPERATIONS_POLICY, bookingHorizonWeeks: 2 };
  validateBookingDate('2026-11-07', now, policy);
  validateBookingDate('2026-11-20', now, policy);
  for (const date of ['2026-11-06', '2026-11-21', '2026-11-31'])
    assert.throws(() => validateBookingDate(date, now, policy));
});

test('hidden slots cannot start new bookings but stay occupied by shopping and all-day shoots', () => {
  const policy = { ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['13:00', '15:00'] };
  assert.deepEqual(requiredSlots('hybrid', '13:00', true, policy), ['13:00', '11:00']);
  assert.throws(() => requiredSlots('hybrid', '11:00', false, policy));
  assert.throws(() => requiredSlots('allday', '13:00', false, policy));
  assert.deepEqual(requiredSlots('allday', '11:00', false, { slotTimes: ['11:00'] }), [
    '11:00',
    '13:00',
    '15:00',
    '17:00',
  ]);
});

test('policy reader uses defaults when unset and reads validated persisted changes', async () => {
  const calls: unknown[][] = [];
  let stored: string | null = null;
  const env = {
    DB: {
      prepare() {
        return {
          bind(...values: unknown[]) {
            calls.push(values);
            return {
              async first() {
                return stored === null ? null : { value_json: stored };
              },
            };
          },
        };
      },
    },
  } as unknown as Env;
  assert.deepEqual(await operationsPolicy(env), DEFAULT_OPERATIONS_POLICY);
  stored = JSON.stringify({ ...DEFAULT_OPERATIONS_POLICY, holdHours: 6 });
  const saved = await operationsPolicy(env);
  assert.equal(saved.holdHours, 6);
  assert.deepEqual(calls, [['operations_policy'], ['operations_policy']]);
  stored = JSON.stringify({ ...DEFAULT_OPERATIONS_POLICY, slotTimes: ['09:00'] });
  await assert.rejects(() => operationsPolicy(env));
});
