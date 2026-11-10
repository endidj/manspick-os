// 직원 역할 목록과 입력값 확인을 한곳에서 관리합니다.

const STAFF_ROLES = ['admin', 'staff', 'director', 'retoucher'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return STAFF_ROLES.some((role) => role === value);
}
