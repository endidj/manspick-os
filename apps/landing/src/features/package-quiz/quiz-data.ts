// 피그마의 다섯 질문과 선택지의 안내 문구를 보관합니다.
import type { IconName } from '@manspick/design-system/icons';

type QuizOption = { value: string; title: string; description?: string; icon: IconName };

export type QuizQuestion = {
  id: string;
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
    description: '해당하는 항목을 모두 골라주세요.',
    multiple: true,
    options: [
      {
        value: 'dating',
        title: '소개팅 · 결혼정보회사',
        description: '매칭앱, 소개팅용 프로필 사진',
        icon: 'solar/heart-bold',
      },
      { value: 'social', title: 'SNS · 인스타그램', icon: 'mdi/instagram' },
      { value: 'business', title: '비즈니스 · 링크드인 · 이력서', icon: 'solar/suitcase-bold' },
      { value: 'occasion', title: '특별한 날 기념', icon: 'solar/gift-bold' },
    ],
  },
  {
    id: 'concerns',
    title: '지금 가장 큰 고민은?',
    description: '해당하는 항목을 모두 골라주세요.',
    multiple: true,
    options: [
      { value: 'style', title: '옷 스타일링을 잘 모르겠다', icon: 'solar/hanger-bold' },
      { value: 'pose', title: '포즈 · 표정이 어색하다', icon: 'solar/camera-bold' },
      { value: 'hair', title: '헤어 · 메이크업도 관리받고 싶다', icon: 'solar/magic-stick-3-bold' },
      { value: 'change', title: '전체적으로 이미지를 확 바꾸고 싶다', icon: 'solar/restart-bold' },
    ],
  },
  {
    id: 'scale',
    title: '원하는 촬영 규모는?',
    description: '가장 가까운 한 가지를 선택하면 다음으로 넘어가요.',
    multiple: false,
    options: [
      { value: 'one', title: '간단하게 1벌이면 충분', icon: 'solar/t-shirt-bold' },
      { value: 'hybrid', title: '2벌 정도, 다양한 느낌으로', icon: 'solar/gallery-bold' },
      { value: 'all-day', title: '하루 종일 올인하고 싶다', icon: 'solar/fire-bold' },
    ],
  },
  {
    id: 'budget',
    title: '예산은 어느 정도 생각하세요?',
    description: '가장 가까운 한 가지를 선택하면 다음으로 넘어가요.',
    multiple: false,
    options: [
      { value: 'under-100', title: '10만원 이하', icon: 'solar/wallet-bold' },
      { value: '100-200', title: '10~20만원', icon: 'solar/wallet-bold' },
      { value: '200-400', title: '20~40만원', icon: 'solar/wallet-bold' },
      { value: 'over-400', title: '40만원 이상', icon: 'solar/wallet-bold' },
    ],
  },
  {
    id: 'extras',
    title: '추가로 관심 있는 건?',
    description: '현재 이용 가능한 서비스를 모두 골라주세요. 없으면 넘어가도 괜찮아요.',
    multiple: true,
    optional: true,
    options: [
      { value: 'hair', title: '헤어 스타일링 & 메이크업', icon: 'solar/magic-stick-3-bold' },
      { value: 'rental', title: '의류 스타일링 · 대여', icon: 'solar/hanger-bold' },
      { value: 'shopping', title: '오프라인 동행 쇼핑', icon: 'solar/bag-bold' },
    ],
  },
];
