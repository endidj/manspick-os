// 새 예약에 적용할 운영 기준과 기존 네 슬롯을 유지하는 안전한 설정 범위를 정의합니다.
import { DomainError } from './errors.ts';

export const SLOT_TIMES = ['11:00', '13:00', '15:00', '17:00'] as const;

export interface OperationsPolicy {
  holdHours: number;
  holdCutoffHours: number;
  bookingHorizonWeeks: number;
  slotTimes: readonly string[];
  surveyLeadDays: number;
  outfitLeadDays: number;
}

export const DEFAULT_OPERATIONS_POLICY: Readonly<OperationsPolicy> = Object.freeze({
  holdHours: 24,
  holdCutoffHours: 2,
  bookingHorizonWeeks: 8,
  slotTimes: Object.freeze([...SLOT_TIMES]),
  surveyLeadDays: 3,
  outfitLeadDays: 2,
});

export function validateOperationsPolicy(value: unknown): OperationsPolicy {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new DomainError('INVALID_POLICY', '운영 기준의 입력 항목을 확인해주세요.');
  const data = value as Record<string, unknown>;
  const limits = {
    holdHours: { label: '입금 잠금 시간', max: 168 },
    holdCutoffHours: { label: '촬영 전 입금 마감 시간', max: 24 },
    bookingHorizonWeeks: { label: '예약 노출 기간', max: 52 },
    surveyLeadDays: { label: '설문 제출 마감', max: 30 },
    outfitLeadDays: { label: '의상 사진 제출 마감', max: 30 },
  };
  for (const [key, { label, max }] of Object.entries(limits)) {
    const number = data[key];
    if (typeof number !== 'number' || !Number.isSafeInteger(number) || number < 1 || number > max)
      throw new DomainError('INVALID_POLICY', `${label} 값은 1~${max} 사이의 정수여야 합니다.`);
  }
  const slots = data.slotTimes;
  if (
    !Array.isArray(slots) ||
    !slots.length ||
    slots.length > SLOT_TIMES.length ||
    new Set(slots).size !== slots.length ||
    slots.some((time) => !SLOT_TIMES.some((allowed) => allowed === time))
  )
    throw new DomainError(
      'INVALID_POLICY',
      '기존 11·13·15·17시 중 예약 시간을 하나 이상 선택해주세요.',
    );

  return {
    holdHours: data.holdHours as number,
    holdCutoffHours: data.holdCutoffHours as number,
    bookingHorizonWeeks: data.bookingHorizonWeeks as number,
    surveyLeadDays: data.surveyLeadDays as number,
    outfitLeadDays: data.outfitLeadDays as number,
    slotTimes: SLOT_TIMES.filter((time) => slots.includes(time)),
  };
}
