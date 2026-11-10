// 예약 가능한 날짜와 점유 시간, 입금 대기 만료 규칙을 계산합니다.
import { DomainError } from './errors.ts';
import { datePlusDays, koreaDate } from './dates.ts';
import { DEFAULT_OPERATIONS_POLICY, SLOT_TIMES } from './operations-policy.ts';
import type { OperationsPolicy } from './operations-policy.ts';

export { SLOT_TIMES } from './operations-policy.ts';

export function requiredSlots(
  packageId: string,
  time: string,
  shopping: boolean,
  policy: Pick<OperationsPolicy, 'slotTimes'> = DEFAULT_OPERATIONS_POLICY,
): string[] {
  if (!policy.slotTimes.includes(time) || !SLOT_TIMES.includes(time as (typeof SLOT_TIMES)[number]))
    throw new DomainError('INVALID_SLOT', '예약 가능한 시간을 선택해주세요.');
  const result: string[] = packageId === 'allday' ? [...SLOT_TIMES] : [time];
  if (packageId === 'allday' && time !== '11:00')
    throw new DomainError('INVALID_SLOT', '올데이는 11시에 시작합니다.');
  const previous = `${String(Number(time.slice(0, 2)) - 2).padStart(2, '0')}:00`;
  if (shopping && SLOT_TIMES.includes(previous as (typeof SLOT_TIMES)[number]))
    result.push(previous);
  return [...new Set(result)];
}

export function holdExpiry(
  bookedAt: Date,
  startsAt: Date,
  policy: Pick<OperationsPolicy, 'holdHours' | 'holdCutoffHours'> = DEFAULT_OPERATIONS_POLICY,
): string {
  const expires = Math.min(
    bookedAt.getTime() + policy.holdHours * 60 * 60 * 1000,
    startsAt.getTime() - policy.holdCutoffHours * 60 * 60 * 1000,
  );
  if (expires <= bookedAt.getTime())
    throw new DomainError(
      'TOO_LATE',
      `촬영 ${policy.holdCutoffHours}시간 전에는 예약할 수 없습니다.`,
      409,
    );
  return new Date(expires).toISOString();
}

export function validateBookingDate(
  date: string,
  now = new Date(),
  policy: Pick<OperationsPolicy, 'bookingHorizonWeeks'> = DEFAULT_OPERATIONS_POLICY,
) {
  const today = koreaDate(now);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    date < datePlusDays(today, 1) ||
    date > datePlusDays(today, policy.bookingHorizonWeeks * 7)
  )
    throw new DomainError(
      'INVALID_DATE',
      `내일부터 ${policy.bookingHorizonWeeks}주 이내의 날짜를 선택해주세요.`,
    );
}
