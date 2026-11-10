// 버튼·패널·날짜 칸·토글이 사용할 디자인 값을 연결합니다.
import { primitiveTokens } from './primitive';
import { semanticTokens } from './semantic';

/** Proposed component mappings; component-state values are not claimed as Figma bindings. */
export const componentTokens = {
  button: {
    primaryBackground: primitiveTokens.color.blue500,
    primaryHoverBackground: primitiveTokens.color.blue600,
    primaryText: semanticTokens.color.text.onAccent,
    radius: semanticTokens.radius[16],
    gap: semanticTokens.space[8],
  },
  panel: {
    background: semanticTokens.color.background.surface,
    border: semanticTokens.color.border.subtle,
    radius: semanticTokens.radius[16],
    padding: semanticTokens.space[24],
  },
  dateCell: {
    selectedBackground: primitiveTokens.color.blue500,
    selectedBorder: semanticTokens.color.border.accent,
    radius: semanticTokens.radius[12],
  },
  switch: {
    width: '36px',
    height: semanticTokens.space[20],
    thumbSize: semanticTokens.space[16],
    offBackground: semanticTokens.color.background.elevated,
    onBackground: semanticTokens.color.action.primary,
    thumbBackground: semanticTokens.color.text.onAccent,
    border: semanticTokens.color.border.strong,
  },
} as const;
