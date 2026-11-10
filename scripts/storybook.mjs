import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const packageRoot = fileURLToPath(new URL('../packages/design-system/', import.meta.url));
const binary = (relative) => fileURLToPath(new URL(`../node_modules/${relative}`, import.meta.url));
const dispatcher = binary('storybook/dist/bin/dispatcher.js');
const config = fileURLToPath(
  new URL('../packages/design-system/vitest.config.ts', import.meta.url),
);
const output = fileURLToPath(new URL('../.local/storybook-static', import.meta.url));
const commands = {
  dev: [
    dispatcher,
    'dev',
    '--port',
    '6006',
    '--host',
    '127.0.0.1',
    '--no-open',
    '--ci',
    '--exact-port',
    '--no-version-updates',
    '--disable-telemetry',
  ],
  build: [dispatcher, 'build', '--disable-telemetry', '--output-dir', output],
  test: [binary('vitest/vitest.mjs'), 'run', '--config', config, '--project', 'storybook'],
  watch: [binary('vitest/vitest.mjs'), '--config', config, '--project', 'storybook'],
  'install-browser': [binary('playwright/cli.js'), 'install', 'chromium'],
};
const command = process.argv[2] ?? 'dev';
if (!(command in commands)) {
  console.error(`Unknown Storybook command: ${command}`);
  process.exitCode = 1;
} else {
  const child = spawn(process.execPath, commands[command], {
    cwd: packageRoot,
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? `${root}.local/playwright`,
      STORYBOOK_DISABLE_TELEMETRY: '1',
    },
    stdio: 'inherit',
    windowsHide: true,
  });
  child.on('error', (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    process.exitCode = code ?? 1;
  });
}
