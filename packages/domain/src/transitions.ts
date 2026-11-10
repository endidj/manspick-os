// 직원 역할에 따라 촬영 상태를 바꿀 수 있는지 검사합니다.
import { DomainError } from './errors.ts';
import { STATUSES, statusInfo } from './status.ts';
import type { ShootStatus } from './status.ts';
import type { StaffRole } from './staff.ts';

export function assertTransition(
  from: ShootStatus,
  to: ShootStatus,
  role: StaffRole,
  reason?: string,
) {
  if (!STATUSES.some((item) => item.id === to) && to !== 'cancelled')
    throw new DomainError('INVALID_STATUS', '허용되지 않은 상태입니다.');
  if (from === 'cancelled')
    throw new DomainError('CANCELLED', '취소된 촬영은 변경할 수 없습니다.', 409);
  if (to === from) return;
  const privileged = role === 'admin' || role === 'staff';
  if (to === 'cancelled') {
    if (!privileged) throw new DomainError('FORBIDDEN', '취소 권한이 없습니다.', 403);
    if (!reason?.trim()) throw new DomainError('REASON_REQUIRED', '취소 사유를 입력해주세요.');
    return;
  }
  const normalNext =
    statusInfo(to).order === statusInfo(from).order + 1 ||
    (from === 'arrived' && to === 'outfit_checked');
  if (!normalNext && (!privileged || !reason?.trim()))
    throw new DomainError(
      'REASON_REQUIRED',
      '상태 건너뛰기·되돌리기에는 운영 권한과 사유가 필요합니다.',
      403,
    );
  if (
    role === 'director' &&
    (statusInfo(to).stage < 4 || statusInfo(to).stage > 6 || to === 'delivered')
  )
    throw new DomainError('FORBIDDEN', '디렉터의 촬영 진행 범위를 벗어납니다.', 403);
  if (role === 'retoucher' && !['retouching', 'delivered'].includes(to))
    throw new DomainError('FORBIDDEN', '보정 업무의 상태만 변경할 수 있습니다.', 403);
}
