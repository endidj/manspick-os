// 로컬 API Worker와 세 Vinext 프런트엔드를 실행합니다.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const children = [];
const commands = [
  [
    'server',
    join(root, 'node_modules/wrangler/bin/wrangler.js'),
    ['dev', '--config', 'infra/wrangler.jsonc', '--port', '8787', '--persist-to', '.local/state'],
    root,
  ],
  ...['landing', 'user', 'admin'].map((name) => {
    const cwd = join(root, 'apps', name);
    const vite = dirname(require.resolve('vite/package.json', { paths: [cwd] }));
    return [name, join(vite, 'bin/vite.js'), ['dev'], cwd];
  }),
];
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
}
for (const [name, script, args, cwd] of commands) {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    env: {
      ...process.env,
      CLOUDFLARE_DEV_REGISTRY_PATH:
        process.env.CLOUDFLARE_DEV_REGISTRY_PATH ?? join(root, '.local', 'dev-registry'),
      WRANGLER_SEND_METRICS: 'false',
      WRANGLER_LOG_PATH: fileURLToPath(new URL('../.local/logs/', import.meta.url)),
      XDG_CONFIG_HOME: fileURLToPath(new URL('../.local/config/', import.meta.url)),
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  for (const stream of [child.stdout, child.stderr])
    stream.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.on('exit', (code) => {
    if (code && !stopping) {
      stop();
      process.exitCode = code;
    }
  });
  children.push(child);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
