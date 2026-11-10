// 모든 예제에 공통 스타일과 접근성 검사 설정을 적용합니다.
import type { Preview } from '@storybook/react-vite';
import { themes } from 'storybook/theming';
import '../src/styles/base.css';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs', 'test'],
  parameters: {
    layout: 'padded',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
    backgrounds: {
      options: {
        dark: { name: '맨즈픽 기본 배경', value: '#0a0a0a' },
        surface: { name: '표면', value: '#141416' },
      },
    },
    docs: { theme: themes.dark },
    options: { storySort: { order: ['Foundations', 'Components', 'Patterns'] } },
    a11y: {
      test: 'error',
      config: {
        rules: [
          {
            id: 'color-contrast',
            // 2026-11-06 사용자 결정: 원본 blue500/흰 글자(4.17:1)를 유지합니다.
            // 이 명시적 조합의 대비만 예외로 두고 이름·키보드 등 나머지 검사는 유지합니다.
            selector:
              '*:not([data-contrast-exception="figma-blue500"]):not([data-contrast-exception="figma-blue500"] *)',
          },
        ],
      },
    },
  },
  initialGlobals: { backgrounds: { value: 'dark' } },
};

export default preview;
