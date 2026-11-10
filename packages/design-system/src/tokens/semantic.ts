// 기본 값을 배경·글자·상태처럼 쓰임새가 있는 이름에 연결합니다.
import { primitiveTokens } from './primitive';

export const semanticTokens = {
  color: {
    background: {
      base: primitiveTokens.color.black,
      surface: primitiveTokens.color.neutral900,
      elevated: primitiveTokens.color.neutral800,
      glass: primitiveTokens.color.white3,
      accentTint: primitiveTokens.color.blue500Alpha12,
      channelPreview: primitiveTokens.color.channelPreview,
    },
    border: {
      subtle: primitiveTokens.color.white8,
      strong: primitiveTokens.color.white16,
      accent: primitiveTokens.color.blue500,
    },
    text: {
      primary: primitiveTokens.color.neutral100,
      secondary: primitiveTokens.color.neutral400,
      tertiary: primitiveTokens.color.neutral500,
      onAccent: primitiveTokens.color.white,
      accent: primitiveTokens.color.blue300,
      onLight: primitiveTokens.color.black,
      danger: primitiveTokens.color.dangerText,
    },
    action: {
      primary: primitiveTokens.color.blue500,
      primaryHover: primitiveTokens.color.blue600,
    },
    status: {
      success: primitiveTokens.color.green500,
      warning: primitiveTokens.color.amber500,
      danger: primitiveTokens.color.red500,
      infoPurple: primitiveTokens.color.purple400,
      purpleLabel: primitiveTokens.color.purple300,
      pink: primitiveTokens.color.pink400,
    },
    brand: { kakao: primitiveTokens.color.kakaoYellow },
  },
  font: primitiveTokens.font,
  space: primitiveTokens.space,
  radius: primitiveTokens.radius,
} as const;

/** Compatibility exports retained for existing applications. */
export const colors = {
  background: semanticTokens.color.background.base,
  surface: semanticTokens.color.background.surface,
  elevated: semanticTokens.color.background.elevated,
  text: semanticTokens.color.text.primary,
  secondary: semanticTokens.color.text.secondary,
  accent: semanticTokens.color.action.primary,
  accentHover: semanticTokens.color.action.primaryHover,
  success: semanticTokens.color.status.success,
  warning: semanticTokens.color.status.warning,
  danger: semanticTokens.color.status.danger,
  kakao: semanticTokens.color.brand.kakao,
} as const;
