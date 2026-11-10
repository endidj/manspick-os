// Storybook 예제를 로컬 Chromium에서 검사하도록 설정합니다.
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const configDir = fileURLToPath(new URL('./', import.meta.url));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= fileURLToPath(
  new URL('../../../.local/playwright', import.meta.url),
);

export default defineConfig({
  root: packageRoot,
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom'] },
  server: { host: '127.0.0.1' },
  test: {
    api: { host: '127.0.0.1' },
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir,
            storybookScript: 'node ../../scripts/storybook.mjs dev',
            storybookUrl: 'http://127.0.0.1:6006',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
        },
      },
    ],
  },
});
