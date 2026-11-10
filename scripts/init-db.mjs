import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = fileURLToPath(
  new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);
for (const args of [
  ['d1', 'migrations', 'apply', 'manspick-local', '--local'],
  ['d1', 'execute', 'manspick-local', '--local', '--file', 'infra/seed.sql'],
]) {
  const result = spawnSync(
    process.execPath,
    [wrangler, ...args, '--config', 'infra/wrangler.jsonc', '--persist-to', '.local/state'],
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
  if (result.status !== 0) process.exit(result.status ?? 1);
}
