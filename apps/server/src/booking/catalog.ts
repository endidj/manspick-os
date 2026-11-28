// 현재 판매 중인 촬영 패키지와 추가 옵션을 조회합니다.
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { defaultAddonRules, defaultPackageRules } from '@manspick/domain';
import { catalogRules } from './catalog-rules.ts';

export async function catalog(
  env: Env,
  { includeInactive = false }: { includeInactive?: boolean } = {},
) {
  const [packages, addons, rules, packageItems] = await Promise.all([
    rows<Omit<PackageDTO, 'active'> & { active: number }>(
      env,
      `SELECT id,name,price_krw AS price,original_price_krw AS originalPrice,shoot_duration_minutes AS duration,outfits,description,is_active AS active FROM packages${includeInactive ? '' : ' WHERE is_active=1'} ORDER BY price_krw`,
    ),
    rows<Omit<AddonDTO, 'active'> & { active: number }>(
      env,
      `SELECT id,name,unit_price_krw AS price,description,max_quantity AS maxQuantity,active FROM items WHERE is_archived=0${includeInactive ? '' : ' AND active=1'} ORDER BY price`,
    ),
    catalogRules(env),
    rows<{
      packageId: string;
      itemId: string;
      inclusionType: 'included' | 'optional';
      quantity: number;
    }>(
      env,
      `SELECT a.package_id AS packageId,a.item_id AS itemId,a.inclusion_type AS inclusionType,a.quantity FROM package_items a JOIN packages p ON p.id=a.package_id JOIN items i ON i.id=a.item_id WHERE i.is_archived=0${includeInactive ? '' : ' AND p.is_active=1 AND i.active=1'} ORDER BY a.package_id,a.item_id`,
    ),
  ]);
  const items = addons.map((item) => ({
    ...item,
    ...defaultAddonRules(item.id, item.maxQuantity),
    ...rules.addons[item.id],
    active: item.active === 1,
  }));
  return {
    items,
    packageItems,
    packages: packages.map((item) => ({
      ...item,
      ...defaultPackageRules(item.id),
      ...rules.packages[item.id],
      active: item.active === 1,
    })),
    addons: items,
  };
}
