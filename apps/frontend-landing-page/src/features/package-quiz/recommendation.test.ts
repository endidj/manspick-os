// 원본 추천 점수·상담 상품 가격과 의상 옵션 수량을 검증합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultPackageRules } from '@manspick/domain';
import type { PackageDTO } from '@manspick/contracts';
import {
  marketingPackages,
  marketingAddons,
  marketingQuote,
  interestedAddonQuantities,
} from './marketing-offers.ts';
import { directPackage, packageScores, recommendedPackage } from './recommendation.ts';

const packages: PackageDTO[] = ['one', 'hybrid', 'allday'].map((id, index) => ({
  id,
  name: id,
  price: 123000 * (index + 1),
  originalPrice: 135000 * (index + 1),
  duration: 90,
  outfits: [1, 2, 4][index],
  retouchCount: 5,
  description: '',
  active: true,
  ...defaultPackageRules(id),
}));
test('all four answer groups use the original recommendation weights', () => {
  const answers = {
    purpose: ['dating', 'sns'],
    concern: ['styling', 'grooming'],
    scale: ['medium'],
    budget: ['mid'],
  };
  assert.deepEqual(packageScores(answers), { one: 0, hybrid: 13, allday: 4 });
  assert.equal(recommendedPackage(answers, packages)?.id, 'hybrid');
  assert.equal(
    recommendedPackage(
      { purpose: ['business'], concern: ['pose'], scale: ['light'], budget: ['low'] },
      packages,
    )?.id,
    'one',
  );
  assert.equal(
    recommendedPackage(
      { purpose: ['special'], concern: ['total'], scale: ['full'], budget: ['premium'] },
      packages,
    )?.id,
    'allday',
  );
});

test('ties keep upstream order and duplicate or unknown answers cannot skew scores', () => {
  assert.deepEqual(packageScores({ purpose: ['dating', 'dating', 'unknown'], addons: ['hair'] }), {
    one: 0,
    hybrid: 2,
    allday: 0,
  });
  assert.equal(recommendedPackage({}, packages)?.id, 'one');
});

test('inactive or unavailable packages are never recommended or directly selected', () => {
  const limited = packages.map((pack) => ({ ...pack, active: pack.id === 'one' }));
  assert.equal(recommendedPackage({ scale: ['full'] }, limited)?.id, 'one');
  assert.equal(recommendedPackage({}, []), undefined);
  assert.equal(directPackage('hybrid', packages), 'hybrid');
  for (const value of ['hybrid', 'invalid', ['one', 'hybrid'], undefined])
    assert.equal(directPackage(value, limited), undefined);
});

test('consultation prices and all seven source options remain separate from booking catalog', () => {
  assert.deepEqual(
    marketingPackages.map((p) => [p.id, p.price]),
    [
      ['one', 85000],
      ['hybrid', 160000],
      ['allday', 500000],
    ],
  );
  assert.deepEqual(
    marketingAddons.map((a) => [a.id, a.price]),
    [
      ['rental', 25000],
      ['outfit', 50000],
      ['lecture', 50000],
      ['hair', 70000],
      ['ai', 70000],
      ['shopping', 100000],
      ['dslr', 120000],
    ],
  );
  assert.equal(
    marketingQuote(marketingPackages[2], marketingAddons, { hair: 1 }).find((a) => a.id === 'hair')
      ?.quantity,
    1,
  );
});

test('source rental and styling limits are independent and clamp after a package switch', () => {
  const quote = marketingQuote(marketingPackages[1], marketingAddons, {
    rental: 4,
    outfit: 4,
    shopping: 3,
  });
  assert.deepEqual(
    quote.filter((a) => ['rental', 'outfit', 'shopping'].includes(a.id)).map((a) => a.quantity),
    [2, 2, 1],
  );
  const smaller = marketingQuote(
    marketingPackages[0],
    marketingAddons,
    Object.fromEntries(quote.map((a) => [a.id, a.quantity])),
  );
  const returned = marketingQuote(
    marketingPackages[1],
    marketingAddons,
    Object.fromEntries(smaller.map((a) => [a.id, a.quantity])),
  );
  assert.deepEqual(
    returned.slice(0, 2).map((a) => a.quantity),
    [1, 1],
  );
  assert.equal(
    marketingQuote(marketingPackages[0], marketingAddons, { rental: NaN, outfit: -1 })[0].quantity,
    0,
  );
});

test('clothing interest has visible quantities and is charged only once', () => {
  const quantities = interestedAddonQuantities(['clothes', 'hair']);
  assert.deepEqual(quantities, { rental: 1, outfit: 1, hair: 1 });
  const quote = marketingQuote(marketingPackages[1], marketingAddons, quantities);
  assert.equal(160000 + quote.reduce((sum, a) => sum + a.price * a.quantity, 0), 305000);
});
