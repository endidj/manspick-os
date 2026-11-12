// 공통 서버의 로컬 번들과 세 Vinext Worker를 순서대로 빌드합니다.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const server = spawnSync(
  process.execPath,
  [fileURLToPath(new URL('./build-server.mjs', import.meta.url))],
  { stdio: 'inherit' },
);
if (server.error) throw server.error;
if (server.status !== 0) process.exit(server.status ?? 1);

const require = createRequire(import.meta.url);
for (const app of ['frontend-landing-page', 'frontend-customer-page', 'frontend-admin-page']) {
  const cwd = fileURLToPath(new URL(`../apps/${app}/`, import.meta.url));
  const vite = dirname(require.resolve('vite/package.json', { paths: [cwd] }));
  const result = spawnSync(process.execPath, [join(vite, 'bin/vite.js'), 'build'], {
    cwd,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
