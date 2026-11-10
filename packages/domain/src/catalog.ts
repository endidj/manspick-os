// 패키지 이름과 부가서비스 수량을 원본 상품 규칙에 맞게 계산합니다.
import { DomainError } from './errors.ts';

export type PackageRules = {
  spotDescription: string;
  baseDifficulty: 'low' | 'medium' | 'high';
  aliases: string[];
};

export type AddonRules = {
  difficultyWeight: number;
  quantityMode: 'single' | 'outfit' | 'shopping' | 'photo' | 'count';
  packageQuantityLimits: Record<string, number>;
  hiddenPackageIds: string[];
  requiresDirector: boolean;
};

export function defaultPackageRules(id: string): PackageRules {
  const rules: Record<string, PackageRules> = {
    one: { spotDescription: '한 동네 7곳', baseDifficulty: 'low', aliases: ['ONE'] },
    hybrid: {
      spotDescription: '한 동네 14곳 · 그루밍 노션',
      baseDifficulty: 'medium',
      aliases: ['HYBRID'],
    },
    allday: {
      spotDescription: '2~3곳 · 15곳+ · 차량',
      baseDifficulty: 'high',
      aliases: ['ALL DAY', 'PREMIUM'],
    },
  };
  return rules[id] ?? { spotDescription: '', baseDifficulty: 'low', aliases: [] };
}

export function defaultAddonRules(id: string, maxQuantity = 1): AddonRules {
  return {
    difficultyWeight: id === 'shopping' ? 2 : ['hair', 'rental', 'outfit'].includes(id) ? 1 : 0,
    quantityMode:
      id === 'extra_retouch'
        ? 'photo'
        : ['rental', 'outfit'].includes(id)
          ? 'outfit'
          : id === 'shopping'
            ? 'shopping'
            : maxQuantity > 1
              ? 'count'
              : 'single',
    packageQuantityLimits: id === 'shopping' ? { one: 1, hybrid: 1, allday: 2 } : {},
    hiddenPackageIds: id === 'hair' ? ['allday'] : [],
    requiresDirector: ['hair', 'rental', 'outfit', 'shopping'].includes(id),
  };
}

export function normalizedPackageLabel(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function resolveCatalogPackage<T extends { id: string; name: string; aliases?: string[] }>(
  packages: T[],
  label: string,
): T | undefined {
  const normalized = normalizedPackageLabel(label);
  return packages.find((pack) =>
    [pack.id, pack.name, ...(pack.aliases ?? [])].some(
      (value) => normalizedPackageLabel(value) === normalized,
    ),
  );
}

export function addonQuantityLimit(
  pack: { id: string; outfits: number },
  addon: { id: string; maxQuantity: number } & Partial<AddonRules>,
) {
  const rule = { ...defaultAddonRules(addon.id, addon.maxQuantity), ...addon };
  if (rule.hiddenPackageIds.includes(pack.id) || rule.quantityMode === 'photo') return 0;
  const limit = rule.packageQuantityLimits[pack.id] ?? addon.maxQuantity;
  return rule.quantityMode === 'outfit'
    ? Math.min(limit, pack.outfits)
    : rule.quantityMode === 'single'
      ? Math.min(limit, 1)
      : limit;
}

export function validateCatalogQuantities(
  pack: { id: string; outfits: number },
  selected: {
    addon: { id: string; maxQuantity: number } & Partial<AddonRules>;
    quantity: number;
  }[],
) {
  let outfits = 0;
  for (const { addon, quantity } of selected) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > addonQuantityLimit(pack, addon))
      throw new DomainError(
        'INVALID_ADDONS',
        '이 패키지에서 신청할 수 있는 옵션 수량을 확인해주세요.',
      );
    if (
      (addon.quantityMode ?? defaultAddonRules(addon.id, addon.maxQuantity).quantityMode) ===
      'outfit'
    )
      outfits += quantity;
  }
  if (outfits > pack.outfits)
    throw new DomainError(
      'OUTFIT_QUANTITY',
      '대여와 코디 제작의 합은 패키지 의상 수를 넘을 수 없습니다.',
    );
}

export function additionalDifficultyWeight(selected: { addon: Partial<AddonRules> }[]) {
  return selected.reduce((sum, { addon }) => sum + (addon.difficultyWeight ?? 0), 0);
}
