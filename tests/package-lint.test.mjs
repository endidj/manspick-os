// 폴더 규칙이 잘못된 의존성과 index 구현을 잡고 정상적인 타입 재수출은 허용하는지 확인합니다.
import path from 'node:path';
import { RuleTester } from 'eslint';
import nextTypescript from 'eslint-config-next/typescript';
import plugin from '../scripts/eslint/package-rules.mjs';

const tester = new RuleTester({ languageOptions: { ecmaVersion: 'latest', sourceType: 'module' } });
const file = (relative) => path.resolve(relative);

tester.run('export-only-index', plugin.rules['export-only-index'], {
  valid: [
    "// 이 폴더의 공개 기능을 모아 전달합니다.\nexport { api } from './api.js';",
    "export * from './types.js';",
  ],
  invalid: [
    { code: 'export const value = 1;', errors: [{ messageId: 'exportOnly' }] },
    {
      code: "import { api } from './api.js'; export { api };",
      errors: [{ messageId: 'exportOnly' }, { messageId: 'exportOnly' }],
    },
  ],
});

tester.run('file-description', plugin.rules['file-description'], {
  valid: ['// 이 파일은 요청 결과를 읽는 도구입니다.\nexport const value=1;'],
  invalid: [{ code: 'export const value=1;', errors: [{ messageId: 'description' }] }],
});

tester.run('function-spacing', plugin.rules['function-spacing'], {
  valid: ['function first() {}\n\nfunction second() {}', 'const first=()=>{};\n\nconst value=1;'],
  invalid: [
    {
      code: 'function first() {}\nfunction second() {}',
      output: 'function first() {}\n\nfunction second() {}',
      errors: [{ messageId: 'blankLine' }],
    },
    {
      code: 'const tools={first(){},second(){}};',
      output: 'const tools={first(){},\n\nsecond(){}};',
      errors: [{ messageId: 'blankLine' }],
    },
  ],
});

tester.run('package-boundaries', plugin.rules['package-boundaries'], {
  valid: [
    {
      filename: file('apps/server/src/http/app.ts'),
      code: "import { DomainError } from '@manspick/domain';",
    },
    {
      filename: file('packages/web/src/proxy/proxy-request.ts'),
      code: "const worker = import('cloudflare:workers');",
    },
    {
      filename: file('packages/design-system/src/components/button/button.tsx'),
      code: "import { Icon } from '../../icons';",
    },
    {
      filename: file('apps/server/src/http/app.ts'),
      code: "import { failure } from './response.ts';",
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import { feature } from '@/features/feature';",
    },
  ],
  invalid: [
    {
      filename: file('packages/domain/src/rules.ts'),
      code: "import { api } from '@manspick/web/client';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/design-system/src/ui.ts'),
      code: "import { statuses } from '@manspick/domain';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/web/src/client/api.ts'),
      code: "import { proxyRequest } from '../proxy/index.ts';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/web/src/client/api.ts'),
      code: "const worker = import('cloudflare:workers');",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import { handleRequest } from '@manspick/server';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/server/src/http/app.ts'),
      code: "import { api } from '@manspick/web/client';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import { handleRequest } from '../../server/src/http/app.ts';",
      errors: [{ messageId: 'boundary' }],
    },
    ...['server', 'admin', 'landing'].map((app) => ({
      filename: file('apps/user/src/feature.ts'),
      code: `import { feature } from '@manspick/${app}';`,
      errors: [{ messageId: 'boundary' }],
    })),
    {
      filename: file('packages/web/src/proxy/proxy-request.ts'),
      code: "import { handleRequest } from '../../../../apps/server/src/http/app.ts';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/server/src/http/app.ts'),
      code: "import { feature } from '../../../admin/src/feature.ts';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "const server = import('@manspick/server');",
      errors: [{ messageId: 'boundary' }],
    },
  ],
});

const typescriptTester = new RuleTester({
  languageOptions: {
    parser: nextTypescript.find((config) => config.languageOptions?.parser).languageOptions.parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
});

typescriptTester.run('typed package-boundaries', plugin.rules['package-boundaries'], {
  valid: [
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import type { ShootDetail } from '@manspick/contracts';",
    },
    {
      filename: file('apps/admin/src/feature.ts'),
      code: "import { type Actor } from '@manspick/contracts';",
    },
    {
      filename: file('apps/admin/src/feature.ts'),
      code: "export type { Actor } from '@manspick/contracts';",
    },
    {
      filename: file('apps/server/src/http/app.ts'),
      code: "import type { Actor } from '@manspick/contracts';",
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "import type { StaffRole } from '@manspick/domain';",
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "type Role = import('@manspick/domain').StaffRole;",
    },
  ],
  invalid: [
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import { Actor } from '@manspick/contracts';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import type { Env } from '@manspick/server';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import { type Actor, handleRequest } from '@manspick/contracts';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "import { StaffRole } from '@manspick/domain';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "import type { Env } from '@manspick/server';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "import type { Context } from 'hono';",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('packages/contracts/src/contracts.ts'),
      code: "type Context = import('hono').Context;",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "type Env = import('@manspick/server').Env;",
      errors: [{ messageId: 'boundary' }],
    },
    {
      filename: file('apps/user/src/feature.ts'),
      code: "import type { Actor } from '../../../packages/contracts/src/contracts.ts';",
      errors: [{ messageId: 'boundary' }],
    },
  ],
});

typescriptTester.run('typed export-only-index', plugin.rules['export-only-index'], {
  valid: [
    "export type { Actor } from './contracts.ts';",
    "export { default, handleRequest } from './worker.ts';",
  ],
  invalid: [
    { code: 'export interface Actor { id: string }', errors: [{ messageId: 'exportOnly' }] },
  ],
});

typescriptTester.run('contracts-types-only', plugin.rules['contracts-types-only'], {
  valid: [
    "import type { StaffRole } from '@manspick/domain'; export interface Actor { role: StaffRole }",
    "import { type StaffRole } from '@manspick/domain'; export type Role = StaffRole;",
    "export type * from './contracts.ts';",
    "export type { Actor } from './contracts.ts';",
    'type Id = string; interface Actor { id: Id }',
  ],
  invalid: [
    { code: 'export const value = 1;', errors: [{ messageId: 'typesOnly' }] },
    { code: 'export enum Role { Admin }', errors: [{ messageId: 'typesOnly' }] },
    { code: "import { role } from '@manspick/domain';", errors: [{ messageId: 'typesOnly' }] },
    { code: "import './runtime.ts';", errors: [{ messageId: 'typesOnly' }] },
    { code: "export * from './contracts.ts';", errors: [{ messageId: 'typesOnly' }] },
    { code: "export { Actor } from './contracts.ts';", errors: [{ messageId: 'typesOnly' }] },
  ],
});
