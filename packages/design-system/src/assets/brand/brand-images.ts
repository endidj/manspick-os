// 공개 검토용 시연 이미지로 브랜드 이미지 이름과 크기 계약을 유지합니다.
import demoImage from './demo-image.svg?url';

export const brandImages = {
  'cross-check-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'cross-check-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'grooming-guide': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-4': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-5': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-after-6': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-4': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-5': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'hero-before-6': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'location-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'location-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'location-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  peace: { src: demoImage, width: 540, height: 720 },
  'props-1': { src: demoImage, width: 540, height: 720 },
  'props-2': { src: demoImage, width: 540, height: 720 },
  'props-3': { src: demoImage, width: 540, height: 720 },
  'props-4': { src: demoImage, width: 540, height: 720 },
  'props-5': { src: demoImage, width: 540, height: 720 },
  'props-6': { src: demoImage, width: 540, height: 720 },
  'props-7': { src: demoImage, width: 540, height: 720 },
  'props-8': { src: demoImage, width: 540, height: 720 },
  'retouch-after-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'retouch-after-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'retouch-after-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'retouch-before-1': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'retouch-before-2': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'retouch-before-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'styling-1': { src: demoImage, width: 540, height: 720 },
  'styling-10': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'styling-11': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'styling-12': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'styling-2': { src: demoImage, width: 540, height: 720 },
  'styling-3': { src: demoImage, width: 540, height: 720 },
  'styling-4': { src: demoImage, width: 540, height: 720 },
  'styling-5': { src: demoImage, width: 540, height: 720 },
  'styling-6': { src: demoImage, width: 540, height: 720 },
  'styling-7': { src: demoImage, width: 540, height: 720 },
  'styling-8': { src: demoImage, width: 540, height: 720 },
  'styling-9': { src: demoImage, width: 540, height: 720 },
  'team-influencer-3': {
    src: demoImage,
    width: 540,
    height: 720,
  },
  'team-influencer-5': {
    src: demoImage,
    width: 540,
    height: 720,
  },
} as const;

export type BrandImageName = keyof typeof brandImages;
