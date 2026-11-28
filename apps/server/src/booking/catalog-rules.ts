// 상품별 원본 규칙을 읽고 관리자가 바꾼 값만 기존 설정 위에 저장합니다.
import {
  defaultAddonRules,
  defaultPackageRules,
  DomainError,
  normalizedPackageLabel,
} from '@manspick/domain';
import type { AddonRules, PackageRules } from '@manspick/domain';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import type { Env } from '../runtime/env.ts';
import { parseJSON } from '../shared/json.ts';
import {
  integerValue,
  objectValue,
  optionalText,
  replaceSetting,
  settingValue,
} from '../settings/values.ts';

type CatalogRules = {
  packages: Record<string, PackageRules>;
  addons: Record<string, AddonRules>;
};

export async function catalogRules(env: Env) {
  return settingValue<CatalogRules>(env, 'catalog_rules', { packages: {}, addons: {} });
}

export function packageRules(
  value: Record<string, unknown>,
  current: PackageDTO,
  packages: PackageDTO[],
): PackageRules {
  const defaults = { ...defaultPackageRules(current.id), ...current };
  const baseDifficulty = value.baseDifficulty ?? defaults.baseDifficulty;
  if (typeof baseDifficulty !== 'string' || !['low', 'medium', 'high'].includes(baseDifficulty))
    throw new DomainError('INVALID_DIFFICULTY', '기본 난이도를 확인해주세요.');
  const aliases = value.aliases ?? defaults.aliases;
  if (
    !Array.isArray(aliases) ||
    aliases.length > 20 ||
    aliases.some((alias) => typeof alias !== 'string' || !alias.trim() || alias.length > 80)
  )
    throw new DomainError('INVALID_ALIASES', '표기 별칭을 80자 이내로 입력해주세요.');
  const labels = [String(value.name), ...aliases].map(normalizedPackageLabel);
  if (
    packages.some(
      (pack) =>
        pack.id !== current.id &&
        [pack.id, pack.name, ...(pack.aliases ?? [])].some((label) =>
          labels.includes(normalizedPackageLabel(label)),
        ),
    )
  )
    throw new DomainError(
      'DUPLICATE_ALIAS',
      '다른 패키지와 겹치는 이름이나 별칭은 사용할 수 없습니다.',
    );
  return {
    spotDescription:
      value.spotDescription === undefined
        ? defaults.spotDescription
        : optionalText(value.spotDescription, 300),
    baseDifficulty: baseDifficulty as PackageRules['baseDifficulty'],
    aliases: [...new Set(aliases.map((alias: string) => alias.trim()))],
  };
}

export function addonRules(
  value: Record<string, unknown>,
  current: Pick<AddonDTO, 'id' | 'maxQuantity'> & Partial<AddonRules>,
  packages: PackageDTO[],
): AddonRules {
  const defaults = { ...defaultAddonRules(current.id, current.maxQuantity), ...current };
  const quantityMode = value.quantityMode ?? defaults.quantityMode;
  if (
    typeof quantityMode !== 'string' ||
    !['single', 'outfit', 'shopping', 'count'].includes(quantityMode)
  )
    throw new DomainError('INVALID_QUANTITY_MODE', '수량 단위를 확인해주세요.');
  const limits =
    value.packageQuantityLimits === undefined
      ? defaults.packageQuantityLimits
      : objectValue(value.packageQuantityLimits);
  const packageQuantityLimits: Record<string, number> = {};
  for (const [key, quantity] of Object.entries(limits)) {
    if (!packages.some((pack) => pack.id === key))
      throw new DomainError('INVALID_PACKAGE', '수량 제한의 패키지를 확인해주세요.');
    packageQuantityLimits[key] = integerValue(quantity, 100);
  }
  const hiddenPackageIds = value.hiddenPackageIds ?? defaults.hiddenPackageIds;
  if (
    !Array.isArray(hiddenPackageIds) ||
    hiddenPackageIds.some(
      (key) => typeof key !== 'string' || !packages.some((pack) => pack.id === key),
    )
  )
    throw new DomainError('INVALID_PACKAGE', '노출 제외 패키지를 확인해주세요.');
  const requiresDirector = value.requiresDirector ?? defaults.requiresDirector;
  if (typeof requiresDirector !== 'boolean')
    throw new DomainError('INVALID_INPUT', '디렉터 자격 검사 여부를 확인해주세요.');
  return {
    difficultyWeight: integerValue(value.difficultyWeight ?? defaults.difficultyWeight, 20),
    quantityMode: quantityMode as AddonRules['quantityMode'],
    packageQuantityLimits,
    hiddenPackageIds: [...new Set(hiddenPackageIds as string[])],
    requiresDirector,
  };
}

export function catalogRuleStatements<K extends keyof CatalogRules>(
  env: Env,
  kind: K,
  key: string,
  rule: CatalogRules[K][string],
  before: string | null,
) {
  const current = parseJSON<CatalogRules | null>(before, null) ?? { packages: {}, addons: {} };
  return replaceSetting(env, 'catalog_rules', before, {
    ...current,
    [kind]: { ...current[kind], [key]: rule },
  });
}
