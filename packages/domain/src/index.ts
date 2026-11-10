// 맨즈픽의 업무 규칙과 타입을 외부에 공개합니다.

export { STATUS_DEFINITIONS, STATUSES, STAGE_LABELS, statusInfo } from './status.ts';
export type { ShootStatus } from './status.ts';
export { isStaffRole } from './staff.ts';
export type { StaffRole } from './staff.ts';
export { DomainError } from './errors.ts';
export { assertTransition } from './transitions.ts';
export { SLOT_TIMES, requiredSlots, holdExpiry, validateBookingDate } from './booking.ts';
export { requiredOutfitPhotos, deadline } from './preparation.ts';
export { koreaDate, datePlusDays } from './dates.ts';
export { DEFAULT_OPERATIONS_POLICY, validateOperationsPolicy } from './operations-policy.ts';
export type { OperationsPolicy } from './operations-policy.ts';
export {
  defaultPackageRules,
  defaultAddonRules,
  normalizedPackageLabel,
  resolveCatalogPackage,
  addonQuantityLimit,
  validateCatalogQuantities,
  additionalDifficultyWeight,
} from './catalog.ts';
export type { PackageRules, AddonRules } from './catalog.ts';
