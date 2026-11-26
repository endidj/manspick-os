// 공통 패키지와 Storybook, 각 앱의 타입을 순서대로 검사합니다.
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';
const projects = [
  'tsconfig.json',
  'packages/design-system/tsconfig.json',
  'packages/design-system/.storybook/tsconfig.json',
  ...globSync('apps/*/tsconfig.json').sort(),
];
for (const project of projects) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '--noEmit', '-p', project],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
