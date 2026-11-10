// 제목·본문·라벨에 사용할 글자 크기와 굵기 조합을 정합니다.
/** Line heights and letter spacing are implementation additions, pending Figma property verification. */
export const typography = {
  'display-l': {
    label: 'Display L',
    family: 'display',
    size: 32,
    weight: 700,
    lineHeight: 40,
    letterSpacing: 0,
  },
  h1: { label: 'H1', family: 'body', size: 24, weight: 700, lineHeight: 34, letterSpacing: 0 },
  h2: { label: 'H2', family: 'body', size: 20, weight: 700, lineHeight: 28, letterSpacing: 0 },
  h3: { label: 'H3', family: 'body', size: 17, weight: 600, lineHeight: 26, letterSpacing: 0 },
  'body-l': {
    label: 'Body L',
    family: 'body',
    size: 16,
    weight: 400,
    lineHeight: 26,
    letterSpacing: 0,
  },
  'body-m': {
    label: 'Body M',
    family: 'body',
    size: 14,
    weight: 400,
    lineHeight: 22,
    letterSpacing: 0,
  },
  'body-m-strong': {
    label: 'Body M Strong',
    family: 'body',
    size: 14,
    weight: 600,
    lineHeight: 22,
    letterSpacing: 0,
  },
  'label-m': {
    label: 'Label M',
    family: 'body',
    size: 15,
    weight: 600,
    lineHeight: 22,
    letterSpacing: 0,
  },
  'label-s': {
    label: 'Label S',
    family: 'body',
    size: 13,
    weight: 500,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    label: 'Caption',
    family: 'body',
    size: 12,
    weight: 400,
    lineHeight: 18,
    letterSpacing: 0,
  },
  overline: {
    label: 'Overline',
    family: 'display',
    size: 11,
    weight: 600,
    lineHeight: 16,
    letterSpacing: 0,
  },
} as const;

export type TypographyName = keyof typeof typography;
