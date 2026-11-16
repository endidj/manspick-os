// 원본 recommend.html의 질문·문구·아이콘을 React 선택 항목으로 옮깁니다.
import type { IconName } from '@manspick/design-system/icons';
import type { QuizAnswers } from './recommendation';

export type QuizOption = { value: string; title: string; description: string; icon: IconName };
export type QuizQuestion = {
  id: keyof QuizAnswers;
  title: string;
  description: string;
  multiple: boolean;
  optional?: boolean;
  options: readonly QuizOption[];
};

export const quizQuestions: readonly QuizQuestion[] = [
  {
    id: 'purpose',
    title: '촬영 목적이 무엇인가요?',
    description: '여러 개 선택할 수 있어요.',
    multiple: true,
    options: [
      {
        value: 'dating',
        title: '소개팅 · 결혼정보회사',
        description: '매칭 앱, 소개팅용 프로필',
        icon: 'solar/heart-bold',
      },
      {
        value: 'sns',
        title: 'SNS · 인스타그램',
        description: '인스타, 카카오 프로필 등',
        icon: 'solar/camera-bold',
      },
      {
        value: 'business',
        title: '비즈니스 · 링크드인 · 이력서',
        description: '취업, 명함, 비즈니스 프로필',
        icon: 'solar/suitcase-bold',
      },
      {
        value: 'special',
        title: '특별한 날 기념',
        description: '생일, 졸업, 기념일 등',
        icon: 'solar/gift-bold',
      },
    ],
  },
  {
    id: 'concern',
    title: '지금 가장 큰 고민은?',
    description: '여러 개 선택할 수 있어요.',
    multiple: true,
    options: [
      {
        value: 'styling',
        title: '옷 스타일링을 잘 모르겠다',
        description: '뭘 입어야 잘 나올지 감이 안 옴',
        icon: 'solar/hanger-bold',
      },
      {
        value: 'pose',
        title: '포즈 · 표정이 어색하다',
        description: '사진 찍으면 항상 어색해서 걱정',
        icon: 'solar/user-bold',
      },
      {
        value: 'grooming',
        title: '헤어 · 메이크업도 관리받고 싶다',
        description: '머리부터 발끝까지 전문가 손길',
        icon: 'solar/magic-stick-3-bold',
      },
      {
        value: 'total',
        title: '전체적으로 이미지를 확 바꾸고 싶다',
        description: '완전히 다른 사람처럼 변신',
        icon: 'solar/star-bold',
      },
    ],
  },
  {
    id: 'scale',
    title: '원하는 촬영 규모는?',
    description: '편하게 골라주세요.',
    multiple: false,
    options: [
      {
        value: 'light',
        title: '간단하게 1벌이면 충분',
        description: '깔끔한 프로필 한 세트',
        icon: 'solar/camera-minimalistic-bold',
      },
      {
        value: 'medium',
        title: '2벌 정도, 다양한 느낌으로',
        description: '캐주얼 + 포멀 등 2가지 컨셉',
        icon: 'solar/gallery-bold',
      },
      {
        value: 'full',
        title: '하루 종일 올인하고 싶다',
        description: '4벌+, 여러 장소, 풀 패키지',
        icon: 'solar/crown-bold',
      },
    ],
  },
  {
    id: 'budget',
    title: '예산은 어느 정도 생각하세요?',
    description: '대략적인 범위면 충분해요.',
    multiple: false,
    options: [
      {
        value: 'low',
        title: '10만원 이하',
        description: '부담 없이 시작하고 싶어요',
        icon: 'solar/wallet-bold',
      },
      {
        value: 'mid',
        title: '10 ~ 20만원',
        description: '적당히 투자할 의향 있어요',
        icon: 'solar/wallet-bold',
      },
      {
        value: 'high',
        title: '20 ~ 40만원',
        description: '제대로 한 번 해보고 싶어요',
        icon: 'solar/wallet-bold',
      },
      {
        value: 'premium',
        title: '40만원 이상',
        description: '최고의 결과를 원해요',
        icon: 'solar/wallet-bold',
      },
    ],
  },
  {
    id: 'addons',
    title: '추가로 관심 있는 건?',
    description: '여러 개 선택할 수 있어요. 없으면 넘어가세요.',
    multiple: true,
    optional: true,
    options: [
      {
        value: 'hair',
        title: '헤어 스타일링 & 메이크업',
        description: '촬영 당일 전문 헤어팀 세팅',
        icon: 'solar/magic-stick-3-bold',
      },
      {
        value: 'clothes',
        title: '의류 스타일링 · 대여',
        description: '인플루언서 소장 의류 or 브랜드 코디',
        icon: 'solar/hanger-bold',
      },
      {
        value: 'dslr',
        title: 'DSLR 스냅 추가 촬영',
        description: '소니 카메라 스냅 + 보정 2장',
        icon: 'solar/camera-bold',
      },
      {
        value: 'ai',
        title: 'AI 스튜디오 프로필 생성',
        description: '촬영 사진 기반 AI 컨셉 사진 2장',
        icon: 'solar/atom-bold',
      },
      {
        value: 'shopping',
        title: '오프라인 동행쇼핑',
        description: '서울권 최대 2시간 함께 쇼핑',
        icon: 'solar/bag-bold',
      },
      {
        value: 'lecture',
        title: '스마트폰 인물사진 강의',
        description: '셀카·인물사진 잘 찍는 법 배우기',
        icon: 'solar/smartphone-bold',
      },
    ],
  },
];

export const addonIcons: Record<string, IconName> = {
  hair: 'solar/magic-stick-3-bold',
  rental: 'solar/hanger-bold',
  outfit: 'solar/t-shirt-bold',
  shopping: 'solar/bag-bold',
  dslr: 'solar/camera-bold',
  ai: 'solar/atom-bold',
  lecture: 'solar/smartphone-bold',
};
