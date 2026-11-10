// Storybook이 읽을 예제와 확장 기능, 로컬 개발 설정을 정합니다.
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  staticDirs: ['./public'],
  core: { disableTelemetry: true },

  async viteFinal(config) {
    return {
      ...config,
      publicDir: false,
      resolve: { ...config.resolve, dedupe: ['react', 'react-dom'] },
      server: { ...config.server, host: '127.0.0.1', strictPort: true },
    };
  },
};

export default config;
