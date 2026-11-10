// 모든 앱과 패키지의 코드 품질 및 패키지 경계를 함께 검사합니다.
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import packageRules from './scripts/eslint/package-rules.mjs';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '**/.next/**',
    '**/.open-next/**',
    '**/.cloudflare/**',
    '**/.local/**',
    '**/.wrangler/**',
    '.yarn/**',
    '**/next-env.d.ts',
  ]),
  { settings: { next: { rootDir: ['apps/admin/', 'apps/user/', 'apps/landing/'] } } },
  {
    files: ['packages/**/*.{ts,tsx,js,mjs}', 'apps/server/**/*.{ts,tsx,js,mjs}'],
    plugins: { manspick: packageRules },
    rules: {
      'manspick/file-description': 'error',
      'manspick/function-spacing': 'error',
      'manspick/package-boundaries': 'error',
    },
  },
  {
    files: ['packages/contracts/**/*.{ts,tsx}'],
    rules: { 'manspick/contracts-types-only': 'error' },
  },
  {
    files: ['packages/**/index.ts'],
    rules: { 'manspick/export-only-index': 'error' },
  },
  {
    files: ['apps/**/*.{ts,tsx}'],
    plugins: { manspick: packageRules },
    rules: { 'manspick/package-boundaries': 'error' },
  },
]);
