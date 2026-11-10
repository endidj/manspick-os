// 안내 조건과 실제 고객 정보의 치환을 검사하며 알 수 없는 개인 링크는 만들지 않습니다.
import { DomainError } from '@manspick/domain';
import type { StaffRole } from '@manspick/domain';
import type { Actor, ShootDetail, TemplateRules } from '@manspick/contracts';
import { objectValue } from '../settings/values.ts';

export function templateRules(value: unknown): TemplateRules {
  const data = objectValue(value);
  const stages = data.stages;
  const packageIds = data.packageIds;
  const addonIds = data.addonIds;
  const roles = data.roles;
  if (
    !Array.isArray(stages) ||
    stages.some((stage) => !Number.isInteger(stage) || stage < 1 || stage > 7) ||
    !Array.isArray(packageIds) ||
    !Array.isArray(addonIds) ||
    [...packageIds, ...addonIds].some(
      (item) => typeof item !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(item),
    ) ||
    !Array.isArray(roles) ||
    roles.some((role) => !['admin', 'staff', 'director'].includes(role))
  )
    throw new DomainError('INVALID_RULES', '안내의 단계·상품·옵션·발송 담당 조건을 확인해주세요.');
  return {
    stages: [...new Set(stages)],
    packageIds: [...new Set(packageIds)],
    addonIds: [...new Set(addonIds)],
    roles: [...new Set(roles)] as StaffRole[],
  };
}

export function matchesTemplate(
  rules: TemplateRules | undefined,
  shoot: ShootDetail,
  role: Actor['role'],
) {
  if (!rules) return true;
  return (
    (!rules.stages.length || rules.stages.includes(shoot.stage)) &&
    (!rules.packageIds.length || rules.packageIds.includes(shoot.packageId)) &&
    (!rules.addonIds.length || shoot.addons.some((addon) => rules.addonIds.includes(addon.id))) &&
    (!rules.roles.length || rules.roles.some((allowed) => allowed === role))
  );
}

export function renderTemplate(body: string, shoot: ShootDetail) {
  const date = shoot.startsAt ? new Date(shoot.startsAt) : null;
  const values: Record<string, string | undefined> = {
    고객명: shoot.customerName,
    촬영일: date
      ? new Intl.DateTimeFormat('ko-KR', {
          month: 'numeric',
          day: 'numeric',
          weekday: 'short',
          timeZone: 'Asia/Seoul',
        }).format(date)
      : undefined,
    촬영시간: date
      ? new Intl.DateTimeFormat('ko-KR', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'Asia/Seoul',
        }).format(date)
      : undefined,
    장소: shoot.preparation?.location.meetingPlace,
    디렉터: shoot.directorName ?? undefined,
    패키지: shoot.packageName,
    의상벌수: String(shoot.package.outfits),
    부가서비스: shoot.addons
      .map((addon) => `${addon.name}${addon.quantity > 1 ? ` ${addon.quantity}개` : ''}`)
      .join(' · '),
  };
  return body
    .split('\n')
    .filter((line) => !line.includes('{부가서비스}') || Boolean(values.부가서비스))
    .join('\n')
    .replace(/\{([^{}]+)\}/g, (match, name: string) => values[name] ?? match);
}
