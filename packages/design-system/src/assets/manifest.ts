// 보관 중인 아이콘·폰트·브랜드 사진의 출처와 수량을 설명합니다.
export const assetManifest = {
  source: 'Manspick design system',
  icons: { solar: 51, demoGlyphs: 2, bytes: 45877, compatibilityOnly: 5 },
  fonts: {
    families: ['Pretendard', 'Geist'],
    format: 'woff2',
    hosting: 'local',
    bytes: 3027484,
    subsetFiles: 92,
    originalsBytes: 2057688,
  },
  brandImages: { slots: 47, format: 'svg', asset: 'demo-image.svg' },
  note: '아이콘과 폰트는 로컬에 보관하며 브랜드 이미지 자리에는 시연 그림을 사용합니다. 고객 파일은 인가된 R2에서 별도로 제공합니다.',
} as const;
