// 원본 recommend.js의 상담용 제안이며 예약 catalog나 관리자 가격을 변경하지 않습니다.
import type { AddonDTO, PackageDTO } from '@manspick/contracts';
import { addonQuantityLimit, defaultPackageRules } from '@manspick/domain';

export type MarketingCatalog = { packages: PackageDTO[]; addons: AddonDTO[] };

export const marketingPackages: PackageDTO[] = [
  {
    id: 'one',
    name: 'ONE',
    price: 85000,
    originalPrice: 120000,
    duration: 90,
    outfits: 1,
    retouchCount: 5,
    description: '',
    active: true,
    ...defaultPackageRules('one'),
  },
  {
    id: 'hybrid',
    name: 'HYBRID',
    price: 160000,
    originalPrice: 210000,
    duration: 120,
    outfits: 2,
    retouchCount: 7,
    description: '',
    active: true,
    ...defaultPackageRules('hybrid'),
  },
  {
    id: 'allday',
    name: 'ALL DAY',
    price: 500000,
    originalPrice: 890000,
    duration: 300,
    outfits: 4,
    retouchCount: 12,
    description: '',
    active: true,
    ...defaultPackageRules('allday'),
  },
];

const sourceAddons = [
  [
    'rental',
    '인플루언서 의류 대여',
    25000,
    '사이즈 체크 후, 46K 인플루언서가 소장하고 있는 의류를 대여해 드립니다. 촬영에 딱 맞는 스타일링이 가능합니다.',
  ],
  [
    'outfit',
    '브랜드 의류 1코디 제작',
    50000,
    '브랜드에서 판매하는 제품으로 촬영 당일에 입을 코디를 제작해 드립니다. 구매 후 본인 소장 가능합니다.',
  ],
  [
    'lecture',
    '스마트폰으로 인물사진 찍는 법',
    50000,
    '전자책 교재를 활용한 실습 강의입니다. 일상에서 스마트폰으로 인물사진을 잘 찍는 노하우를 배울 수 있습니다.',
  ],
  [
    'hair',
    '헤어 스타일링 & 데일리 메이크업',
    70000,
    '촬영 당일 전문 헤어팀이 현장 방문하여 헤어 세팅 + 데일리 메이크업을 진행합니다. 피부·헤어 관리 정보도 함께 제공됩니다.',
  ],
  [
    'ai',
    'AI 스튜디오 프로필 생성',
    70000,
    '촬영한 사진을 바탕으로 AI를 활용하여 스튜디오에서 찍은 듯한 컨셉 사진을 제공합니다. (2장 제공)',
  ],
  [
    'shopping',
    '서울권 오프라인 동행쇼핑',
    100000,
    '촬영 전, 최대 2시간 동안 함께 쇼핑하며 촬영에 입을 옷을 골라드립니다. 체형·분위기에 맞는 스타일링 코칭도 함께 진행됩니다.',
  ],
  [
    'dslr',
    'DSLR 스냅 촬영 추가',
    120000,
    '전문직/기업 프로필 추천. 소니 카메라를 활용한 스냅 촬영이 포함되며, 프리미엄 보정본 2장이 추가 제공됩니다.',
  ],
] as const;
export const marketingAddons: AddonDTO[] = sourceAddons.map(([id, name, price, description]) => ({
  id,
  name,
  price,
  description,
  active: true,
  maxQuantity: ['rental', 'outfit'].includes(id) ? 4 : 1,
  quantityMode: ['rental', 'outfit'].includes(id) ? 'outfit' : 'single',
  difficultyWeight: 0,
  packageQuantityLimits: {},
  hiddenPackageIds: [],
  requiresDirector: false,
}));

export const marketingIncludes: Record<string, string[]> = {
  one: [
    '1:1 사전 컨설팅',
    '의상 가이드 + 코디북',
    '1시간30분 촬영 · 1벌 · 스팟7',
    '포즈·표정 디렉팅',
    '원본 300장+',
    '프리미엄 보정 5장',
    '무제한 수정',
    '무료 재촬영',
  ],
  hybrid: [
    '1:1 사전 컨설팅',
    '의상 가이드 + 코디북',
    '그루밍 노션',
    '2시간 촬영 · 2벌 · 스팟14',
    '포즈·표정 디렉팅',
    '원본 500장+',
    '프리미엄 보정 7장',
    '무제한 수정',
    '무료 재촬영',
  ],
  allday: [
    '1:1 사전 컨설팅',
    '외모 피드백 + 코디북',
    '그루밍 노션',
    '헤어 스타일링 + 메이크업',
    '5시간+ 촬영 · 4벌 · N장소',
    '차량 이동',
    '포즈·표정 디렉팅',
    '원본 700장+',
    '프리미엄 보정 12장',
    '무제한 수정',
    '무료 재촬영',
  ],
};
export const marketingAddonSummary: Record<string, string> = {
  hair: '헤어 & 메이크업',
  rental: '인플루언서 의류 대여',
  outfit: '브랜드 1코디 제작',
  dslr: 'DSLR 스냅 촬영',
  ai: 'AI 프로필 2장',
  shopping: '오프라인 동행쇼핑',
  lecture: '스마트폰 사진 강의',
};

// 원본은 대여·코디를 각각 패키지 벌수까지 선택합니다. 예약의 공유 벌수 정책과 분리합니다.
export function marketingQuote(
  pack: PackageDTO,
  addons: AddonDTO[],
  quantities: Record<string, number>,
) {
  return addons
    .filter((addon) => addon.active)
    .map((addon) => {
      const maximum = addonQuantityLimit(pack, addon);
      const requested = quantities[addon.id] ?? 0;
      return {
        ...addon,
        maximum,
        quantity: Math.min(
          maximum,
          Number.isFinite(requested) ? Math.max(0, Math.floor(requested)) : 0,
        ),
      };
    });
}

export function interestedAddonQuantities(interests: string[] = []) {
  return Object.fromEntries(
    interests
      .flatMap((id) => (id === 'clothes' ? ['rental', 'outfit'] : [id]))
      .map((id) => [id, 1]),
  );
}
