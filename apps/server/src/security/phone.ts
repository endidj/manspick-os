// 입력한 전화번호를 검증하고 화면에 필요한 부분만 표시합니다.
import { DomainError } from '@manspick/domain';

export function normalizePhone(value: string) {
  const phone = value.replace(/[^0-9]/g, '');
  if (!/^01[0-9]{8,9}$/.test(phone))
    throw new DomainError('INVALID_PHONE', '휴대전화 번호를 확인해주세요.');
  return phone;
}

export function maskPhone(phone: string) {
  return phone ? `${phone.slice(0, 3)}-****-${phone.slice(-4)}` : '';
}
