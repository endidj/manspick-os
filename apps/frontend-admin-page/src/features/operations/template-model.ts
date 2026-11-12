// 템플릿 미리보기의 조건을 실제 고객과 직원 역할에 맞춰 판단합니다.
import type { StaffRole } from '@manspick/domain';

type Conditions = {
  stages: readonly number[];
  packageIds: readonly string[];
  addonIds: readonly string[];
  roles: readonly StaffRole[];
};

type PreviewCustomer = { stage: number; packageId: string; addonIds: readonly string[] };

export function templateMatches(
  template: { active: boolean; rules?: Conditions },
  customer: PreviewCustomer,
  role: StaffRole,
) {
  if (!template.active) return false;
  const rules = template.rules;
  return (
    !rules ||
    ((!rules.stages.length || rules.stages.includes(customer.stage)) &&
      (!rules.packageIds.length || rules.packageIds.includes(customer.packageId)) &&
      (!rules.addonIds.length || rules.addonIds.some((id) => customer.addonIds.includes(id))) &&
      (!rules.roles.length || rules.roles.includes(role)))
  );
}
