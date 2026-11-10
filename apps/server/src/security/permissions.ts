// 관리자, 운영자, 고객, 촬영 담당자만 할 수 있는 작업을 구분합니다.
import { DomainError } from '@manspick/domain';
import type { StaffRole } from '@manspick/domain';
import type { Actor } from '@manspick/contracts';

const permissions = {
  operate: ['admin', 'staff'],
  administer: ['admin'],
  direct: ['admin', 'staff', 'director'],
  retouch: ['admin', 'staff', 'retoucher'],
} satisfies Record<string, StaffRole[]>;

export function staffCan(actor: Actor, permission: keyof typeof permissions) {
  return actor.kind === 'staff' && permissions[permission].some((role) => role === actor.role);
}

export function operationAllowed(actor: Actor) {
  return staffCan(actor, 'operate');
}

export function operator(actor: Actor) {
  if (!operationAllowed(actor)) throw new DomainError('FORBIDDEN', '운영 권한이 필요합니다.', 403);
}

export function administrator(actor: Actor) {
  if (!staffCan(actor, 'administer'))
    throw new DomainError('FORBIDDEN', '관리자 권한이 필요합니다.', 403);
}

export function customer(actor: Actor) {
  if (actor.kind !== 'customer')
    throw new DomainError('FORBIDDEN', '고객 본인의 요청만 가능합니다.', 403);
}

export function director(actor: Actor) {
  if (!staffCan(actor, 'direct'))
    throw new DomainError('FORBIDDEN', '촬영 담당 권한이 필요합니다.', 403);
}
