// 현재 판매 중인 촬영 패키지와 추가 옵션을 조회합니다.
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { defaultAddonRules, defaultPackageRules } from '@manspick/domain';
import { catalogRules } from './catalog-rules.ts';
import { retouchOffering } from '../settings/retouch-price.ts';

export async function catalog(
  env: Env,
  { includeInactive = false }: { includeInactive?: boolean } = {},
) {
  const visibility = includeInactive ? '' : ' WHERE active=1';
  const [packages, addons, rules] = await Promise.all([
    rows<Omit<PackageDTO, 'active'> & { active: number }>(
      env,
      `SELECT id,name,price,original_price AS originalPrice,duration,outfits,retouch_count AS retouchCount,description,active FROM packages${visibility} ORDER BY price`,
    ),
    rows<Omit<AddonDTO, 'active'> & { active: number }>(
      env,
      `SELECT id,name,price,description,max_quantity AS maxQuantity,active FROM addons${visibility} ORDER BY price`,
    ),
    catalogRules(env),
  ]);
  if (includeInactive && !addons.some((addon) => addon.id === 'extra_retouch'))
    addons.push({
      id: 'extra_retouch',
      name: '추가 보정',
      price: 10000,
      description: '셀렉 · 후속에서 신청',
      maxQuantity: 100,
      active: 1,
    });
  const mappedAddons = addons.map((item) => ({
    ...item,
    ...defaultAddonRules(item.id, item.maxQuantity),
    ...rules.addons[item.id],
    active: item.active === 1,
  }));
  const retouch = await retouchOffering(env);
  return {
    retouchUnitPrice: retouch.unitPrice,
    extraRetouchAvailable: retouch.available,
    packages: packages.map((item) => ({
      ...item,
      ...defaultPackageRules(item.id),
      ...rules.packages[item.id],
      active: item.active === 1,
    })),
    addons: includeInactive
      ? mappedAddons
      : mappedAddons.filter((addon) => addon.quantityMode !== 'photo'),
  };
}
