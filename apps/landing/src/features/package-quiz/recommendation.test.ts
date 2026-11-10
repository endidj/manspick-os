// 촬영 규모의 상품 연결과 예산 경계가 바뀌지 않는지 확인합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultAddonRules, defaultPackageRules } from '@manspick/domain';
import { budgetExceeded, quoteAddons, recommendedPackage } from './recommendation.ts';

test('recommendations follow the chosen scale and budget only adds an advisory', () => {
  assert.equal(recommendedPackage('one'), 'one');
  assert.equal(recommendedPackage('hybrid'), 'hybrid');
  assert.equal(recommendedPackage('all-day'), 'allday');
  assert.equal(recommendedPackage(''), 'one');
  assert.equal(budgetExceeded('under-100', 100000), false);
  assert.equal(budgetExceeded('under-100', 100001), true);
  assert.equal(budgetExceeded('100-200', 160000), false);
  assert.equal(budgetExceeded('200-400', 500000), true);
  assert.equal(budgetExceeded('over-400', 600000), false);
});

test('the live quote uses catalog limits and prices for the selected package', () => {
  const pack = {
    id: 'one',
    name: '원',
    price: 123000,
    originalPrice: 135000,
    duration: 90,
    outfits: 1,
    retouchCount: 5,
    description: '',
    active: true,
    ...defaultPackageRules('one'),
  };
  const addons = ['rental', 'outfit', 'hair'].map((id, index) => ({
    id,
    name: id,
    price: (index + 1) * 1000,
    description: '',
    maxQuantity: id === 'hair' ? 1 : 4,
    active: true,
    ...defaultAddonRules(id, id === 'hair' ? 1 : 4),
  }));
  const quote = quoteAddons(pack, addons, { rental: 4, outfit: 1, hair: 2 });
  assert.deepEqual(
    quote.map(({ quantity, maximum }) => [quantity, maximum]),
    [
      [1, 1],
      [0, 0],
      [1, 1],
    ],
  );
  assert.equal(
    pack.price + quote.reduce((sum, item) => sum + item.price * item.quantity, 0),
    127000,
  );
  assert.equal(
    quoteAddons({ ...pack, id: 'allday' }, addons, {}).some((item) => item.id === 'hair'),
    false,
  );
});
