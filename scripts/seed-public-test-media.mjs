// 공개 테스트 버킷의 가상 사진 15개를 기존 가상 데이터 키에 맞춰 저장합니다.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const wrangler = fileURLToPath(
  new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url),
);
const fixture = fileURLToPath(new URL('../infra/fixtures/public-test-photo.svg', import.meta.url));
const keys = [
  ...Array.from({ length: 8 }, (_, index) => 'demo/selection/' + (index + 1)),
  ...Array.from({ length: 3 }, (_, index) => 'demo/result/candidate/' + (index + 1)),
  ...Array.from({ length: 3 }, (_, index) => 'demo/result/retouched/' + (index + 1)),
  'demo/original/1',
];
for (const key of keys) {
  const result = spawnSync(
    process.execPath,
    [
      wrangler,
      'r2',
      'object',
      'put',
      'manspick-public-test-media/' + key,
      '--file',
      fixture,
      '--content-type',
      'image/svg+xml',
      '--remote',
    ],
    { stdio: 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
