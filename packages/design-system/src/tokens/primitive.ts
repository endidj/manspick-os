// 원본에서 확인한 색상·간격·모서리·서체의 기본 값과 출처를 모읍니다.
/** Figma Foundations canvas text, not an extracted Figma variable collection. */
export const tokenProvenance = {
  source: 'Manspick design foundations',
  confirmed: 'Colors, font families, weights, font sizes, spacing and radii',
  implementation: 'CSS names, semantic/component mappings, line heights and letter spacing',
} as const;

export const primitiveTokens = {
  color: {
    black: '#0A0A0A',
    neutral900: '#141416',
    neutral800: '#1C1C1F',
    neutral100: '#F5F5F5',
    neutral400: '#A1A1AA',
    neutral500: '#71717A',
    white: '#FFFFFF',
    white3: 'rgb(255 255 255 / 3%)',
    white8: 'rgb(255 255 255 / 8%)',
    white16: 'rgb(255 255 255 / 16%)',
    blue300: '#57C3FA',
    blue500: '#2D76F6',
    blue600: '#1F5CD1',
    blue500Alpha12: 'rgb(45 118 246 / 12%)',
    green500: '#22C55E',
    amber500: '#F59E0B',
    red500: '#EF4444',
    purple400: '#A78BFA',
    purple300: '#C4B5FD',
    pink400: '#F472B6',
    channelPreview: '#B3C9D9',
    dangerText: '#FFB1B1',
    kakaoYellow: '#FEE500',
  },
  space: { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 40: 40 },
  radius: { 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, full: 9999 },
  font: {
    body: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif",
    display: "'Geist', 'Pretendard', sans-serif",
  },
} as const;

export const spacing = [4, 8, 12, 16, 20, 24, 32, 40] as const;

export const radii = [8, 12, 16, 24, 'full'] as const;

export type SpaceToken = keyof typeof primitiveTokens.space;

export type RadiusToken = keyof typeof primitiveTokens.radius;
