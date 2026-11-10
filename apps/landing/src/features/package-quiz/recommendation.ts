// 선택한 촬영 규모를 기존 상품에 연결하고 예산 참고 문구를 계산합니다.
import { addonQuantityLimit } from '@manspick/domain';
import type { AddonDTO, PackageDTO } from '@manspick/contracts';

export function recommendedPackage(scale: string): 'one' | 'hybrid' | 'allday' {
  if (scale === 'all-day') return 'allday';

  return scale === 'hybrid' ? 'hybrid' : 'one';
}

export function quoteAddons(
  pack: PackageDTO,
  addons: AddonDTO[],
  quantities: Record<string, number>,
) {
  let outfitsLeft = pack.outfits;
  const available = addons.flatMap((addon) => {
    const maximum = addonQuantityLimit(pack, addon);
    if (!maximum) return [];
    const quantity = Math.min(
      quantities[addon.id] ?? 0,
      addon.quantityMode === 'outfit' ? outfitsLeft : maximum,
      maximum,
    );
    if (addon.quantityMode === 'outfit') outfitsLeft -= quantity;
    return [{ ...addon, maximum, quantity }];
  });
  return available.map((item) =>
    item.quantityMode === 'outfit'
      ? { ...item, maximum: Math.min(item.maximum, item.quantity + outfitsLeft) }
      : item,
  );
}

export function budgetExceeded(budget: string, total: number) {
  const maximum = { 'under-100': 100000, '100-200': 200000, '200-400': 400000 }[budget];

  return maximum !== undefined && total > maximum;
}
