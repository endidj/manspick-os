// 원격 배포 없이 공통 서버를 로컬 Worker 번들로 검증합니다.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url)),
    'deploy',
    '--dry-run',
    '--config',
    'infra/wrangler.jsonc',
    '--outdir',
    fileURLToPath(new URL('../.local/build/server/', import.meta.url)),
  ],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: 'false',
      WRANGLER_LOG_PATH: fileURLToPath(new URL('../.local/logs/', import.meta.url)),
      XDG_CONFIG_HOME: fileURLToPath(new URL('../.local/config/', import.meta.url)),
    },
  },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
