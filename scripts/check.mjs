// 공통 패키지와 Storybook, 세 Next 앱의 타입을 순서대로 검사합니다.
import { spawnSync } from 'node:child_process';
const projects = [
  'tsconfig.json',
  'packages/design-system/tsconfig.json',
  'packages/design-system/.storybook/tsconfig.json',
  'apps/server/tsconfig.json',
  ...['frontend-landing-page', 'frontend-customer-page', 'frontend-admin-page'].map(
    (app) => `apps/${app}/tsconfig.json`,
  ),
];
for (const project of projects) {
  const result = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '--noEmit', '-p', project],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}
