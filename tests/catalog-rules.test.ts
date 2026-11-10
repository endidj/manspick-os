// 화면과 서버가 같은 상품 별칭·수량·난이도 합산 규칙을 사용하는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  additionalDifficultyWeight,
  addonQuantityLimit,
  defaultAddonRules,
  defaultPackageRules,
  resolveCatalogPackage,
  validateCatalogQuantities,
} from '../packages/domain/src/index.ts';

test('package normalization accepts source aliases without losing canonical IDs', () => {
  const packages = [
    { id: 'one', name: '원', ...defaultPackageRules('one') },
    { id: 'allday', name: '올데이', ...defaultPackageRules('allday') },
  ];
  assert.equal(resolveCatalogPackage(packages, ' ALL-DAY ')?.id, 'allday');
  assert.equal(resolveCatalogPackage(packages, 'premium')?.id, 'allday');
  assert.equal(resolveCatalogPackage(packages, '원')?.id, 'one');
  assert.equal(resolveCatalogPackage(packages, 'missing'), undefined);
});

test('source limits combine outfit options, hide included hair, and allow two allday shopping visits', () => {
  const pack = { id: 'allday', outfits: 4 };
  const shopping = { id: 'shopping', maxQuantity: 1, ...defaultAddonRules('shopping') };
  const hair = { id: 'hair', maxQuantity: 1, ...defaultAddonRules('hair') };
  assert.equal(addonQuantityLimit(pack, shopping), 2);
  assert.equal(addonQuantityLimit({ id: 'one', outfits: 1 }, shopping), 1);
  assert.equal(addonQuantityLimit(pack, hair), 0);
  const rental = { id: 'rental', maxQuantity: 4, ...defaultAddonRules('rental') };
  const outfit = { id: 'outfit', maxQuantity: 4, ...defaultAddonRules('outfit') };
  assert.throws(
    () =>
      validateCatalogQuantities(pack, [
        { addon: rental, quantity: 3 },
        { addon: outfit, quantity: 2 },
      ]),
    { code: 'OUTFIT_QUANTITY' },
  );
  assert.doesNotThrow(() =>
    validateCatalogQuantities(pack, [
      { addon: rental, quantity: 2 },
      { addon: outfit, quantity: 2 },
    ]),
  );
  assert.equal(additionalDifficultyWeight([{ addon: rental }, { addon: shopping }]), 3);
  assert.equal(
    addonQuantityLimit(pack, {
      id: 'extra_retouch',
      maxQuantity: 100,
      ...defaultAddonRules('extra_retouch'),
    }),
    0,
  );
});
