// 파일을 나누기 전후에도 예약 날짜·준비 기한·연락처 처리의 결과가 같은지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  datePlusDays,
  deadline,
  koreaDate,
  requiredOutfitPhotos,
  validateBookingDate,
} from '../packages/domain/src/index.ts';
import { normalizePhone, maskPhone } from '../apps/server/src/security/phone.ts';

test('booking dates use Seoul tomorrow through day56 and reject impossible calendar dates', () => {
  const now = new Date('2026-11-05T15:30:00Z');
  assert.equal(koreaDate(now), '2026-11-06');
  assert.equal(datePlusDays('2026-12-31', 1), '2027-01-01');
  validateBookingDate('2026-11-07', now);
  validateBookingDate(datePlusDays('2026-11-06', 56), now);
  for (const date of ['2026-11-06', datePlusDays('2026-11-06', 57), '2026-11-31', '2026-2-07'])
    assert.throws(() => validateBookingDate(date, now));
});

test('preparation deadlines stay at Seoul20h and required outfit photos never go negative', () => {
  assert.equal(
    deadline('2026-11-14T11:00:00+09:00', 3, new Date('2026-11-01T00:00:00Z')),
    '2026-11-11T11:00:00.000Z',
  );
  assert.equal(
    deadline('2026-11-14T11:00:00+09:00', 3, new Date('2026-11-12T00:00:00Z')),
    '2026-11-13T11:00:00.000Z',
  );
  assert.equal(requiredOutfitPhotos(3, 1, 1), 1);
  assert.equal(requiredOutfitPhotos(1, 2, 2), 0);
});

test('customer phone normalization validates mobiles and masking preserves the last4', () => {
  assert.equal(normalizePhone('010-1234-5678'), '01012345678');
  assert.equal(maskPhone('01012345678'), '010-****-5678');
  assert.equal(maskPhone(''), '');
  assert.throws(() => normalizePhone('02-1234-5678'));
  assert.throws(() => normalizePhone(''));
});
