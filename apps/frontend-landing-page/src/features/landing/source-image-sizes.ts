// 원본 카드·그리드의 실제 표시 폭을 브라우저의 이미지 선택에 전달합니다.
export const sourceImageSizes = {
  avatar: '(min-width: 640px) 40px, 36px',
  reviewAvatar: '40px',
  beforeAfter:
    '(min-width: 1280px) 168px, (min-width: 1024px) calc((100vw - 272px) / 6), (min-width: 768px) calc((100vw - 196px) / 4), (min-width: 640px) calc((100vw - 168px) / 4), calc((100vw - 82px) / 2)',
  location:
    '(min-width: 1280px) 212px, (min-width: 1024px) 18vw, (min-width: 768px) calc((100vw - 96px) / 3), (min-width: 640px) calc((100vw - 80px) / 3), calc((100vw - 56px) / 3)',
  styling:
    '(min-width: 1280px) 162px, (min-width: 1024px) 14vw, (min-width: 640px) calc((100vw - 84px) / 4), calc((100vw - 56px) / 3)',
  retouch:
    '(min-width: 1280px) 260px, (min-width: 1024px) 22vw, (min-width: 640px) calc((100vw - 80px) / 3), calc((100vw - 64px) / 3)',
  crossCheck:
    '(min-width: 1280px) 424px, (min-width: 1024px) 36vw, (min-width: 640px) calc((100vw - 48px) * 0.62), calc((100vw - 32px) * 0.62)',
  props:
    '(min-width: 1280px) 162px, (min-width: 1024px) 14vw, (min-width: 640px) calc((100vw - 84px) / 4), calc((100vw - 68px) / 4)',
  team: '(min-width: 1280px) 390px, (min-width: 768px) calc((100vw - 112px) / 3), calc(100vw - 32px)',
  gallery:
    '(min-width: 1024px) 336px, (min-width: 640px) calc((100vw - 64px) / 3), calc((100vw - 48px) / 2)',
  guide: '(min-width: 768px) 320px, calc(100vw - 48px)',
} as const;
