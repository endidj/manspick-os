// 앱·정적 자산의 검색 제외 범위와 고객 개인 링크의 기존 보호 헤더를 검사합니다.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import adminConfig from '../apps/frontend-admin-page/next.config.ts';
import customerConfig from '../apps/frontend-customer-page/next.config.ts';

const requiredDirectives = ['noindex', 'nofollow', 'noarchive', 'noimageindex'];

function assertExcluded(value: string | undefined) {
  assert.ok(value, 'search exclusion directives must be present');
  const directives = value.toLowerCase().split(/\s*,\s*/);
  for (const directive of requiredDirectives) assert.ok(directives.includes(directive), directive);
}

test('admin and customer routes exclude every response from indexing', async () => {
  for (const config of [adminConfig, customerConfig]) {
    const rules = await config.headers?.();
    const common = rules?.find((rule) => rule.source === '/:path*');
    assert.ok(common, 'root, nested, and API routes need the same search header');
    assertExcluded(common.headers.find((header) => header.key === 'X-Robots-Tag')?.value);
    for (const rule of rules ?? []) {
      const override = rule.headers.find((header) => header.key === 'X-Robots-Tag');
      if (override) assertExcluded(override.value);
    }
  }
});

test('customer private links retain no-referrer and no-store protection', async () => {
  const rules = await customerConfig.headers?.();
  const privateHeaders = rules?.find((rule) => rule.source === '/s/:path*')?.headers;
  assert.equal(
    privateHeaders?.find((header) => header.key === 'Referrer-Policy')?.value,
    'no-referrer',
  );
  assert.equal(
    privateHeaders?.find((header) => header.key === 'Cache-Control')?.value,
    'private, no-store',
  );
});

test('all static hosts exclude assets while allowing crawlers to read the exclusion', async () => {
  for (const directory of [
    'apps/frontend-admin-page/public',
    'apps/frontend-customer-page/public',
    'apps/frontend-empty-page/public',
    'packages/design-system/.storybook/public',
  ]) {
    const headers = await readFile(new URL(`../${directory}/_headers`, import.meta.url), 'utf8');
    assert.match(headers, /^\/\*\s*$/m);
    assertExcluded(headers.match(/^\s+X-Robots-Tag:\s*(.+)$/im)?.[1]);
    const robots = await readFile(new URL(`../${directory}/robots.txt`, import.meta.url), 'utf8');
    assert.match(robots, /^User-agent:\s*\*\s*$/im);
    assert.match(robots, /^Allow:\s*\/\s*$/im);
    assert.doesNotMatch(robots, /^(?:Disallow|Sitemap):\s*\S+/im);
  }
});

test('Storybook manager and preview documents both carry search exclusion metadata', async () => {
  for (const name of ['manager-head', 'preview-head']) {
    const html = await readFile(
      new URL(`../packages/design-system/.storybook/${name}.html`, import.meta.url),
      'utf8',
    );
    assertExcluded(html.match(/<meta name="robots" content="([^"]+)"/i)?.[1]);
  }
});
