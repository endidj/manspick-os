// 공개 사이트의 검색 허용 범위와 구형 주소의 이동 계약을 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  brandedPageTitle,
  productionOrigin,
  resolveSiteSettings,
  serializeStructuredData,
} from '../apps/frontend-landing-page/src/features/seo/settings.ts';
import { legacyRedirect } from '../apps/frontend-landing-page/src/features/seo/legacy-redirect.ts';
import config from '../apps/frontend-landing-page/next.config.ts';
import { config as proxyConfig, proxy } from '../apps/frontend-landing-page/src/proxy.ts';

test('page titles include the full brand without depending on a parent title template', () => {
  assert.equal(brandedPageTitle('맞춤 패키지 추천'), '맞춤 패키지 추천 | 맨즈픽 MANSPICK');
  assert.equal(
    brandedPageTitle('맨즈픽 MANSPICK | 남자 프로필사진'),
    '맨즈픽 MANSPICK | 남자 프로필사진',
  );
  assert.equal(
    brandedPageTitle('개인정보처리방침 | 맨즈픽 MANSPICK'),
    '개인정보처리방침 | 맨즈픽 MANSPICK',
  );
});

test('only an explicit production build at the canonical origin can be indexed', () => {
  assert.deepEqual(resolveSiteSettings(), { origin: productionOrigin, indexable: false });
  assert.deepEqual(resolveSiteSettings(undefined, true), {
    origin: productionOrigin,
    indexable: true,
  });
  assert.equal(resolveSiteSettings(`${productionOrigin}/`, true).indexable, true);
  assert.equal(resolveSiteSettings(productionOrigin, false).indexable, false);
  for (const origin of [
    'https://manspick.kr',
    'https://manspick.co.kr',
    'http://www.manspick.co.kr',
    'https://www.manspick.co.kr.evil.example',
    'https://www.manspick.co.kr:3000',
    'http://manspick.kr',
    'http://localhost:3000',
    'https://localhost',
    'https://127.0.0.1',
    'https://[::1]',
    'https://192.168.1.10',
    'https://10.1.1.2',
    'https://172.16.1.2',
    'https://preview.example.com',
    'https://manspick-landing-test.winningant8.workers.dev',
    'https://manspick-site.vercel.app',
    'https://manspick.pages.dev',
  ]) {
    assert.equal(resolveSiteSettings(origin, true).indexable, false, origin);
  }
});

test('canonical settings reject invalid origins and strip paths, credentials and queries', () => {
  for (const origin of [
    'not a URL',
    'javascript:alert(1)',
    'ftp://example.com',
    'https://user:secret@www.manspick.co.kr',
  ]) {
    assert.deepEqual(resolveSiteSettings(origin, true), {
      origin: productionOrigin,
      indexable: false,
    });
  }
  assert.deepEqual(resolveSiteSettings(` ${productionOrigin}/some-path?pkg=one#faq `, true), {
    origin: productionOrigin,
    indexable: true,
  });
});

test('HTTP rules keep preview hosts, recommendations and API responses excluded', async () => {
  const rules = await config.headers?.();
  assert.ok(rules);
  const preview = rules.find((rule) => rule.source === '/:path*');
  assert.deepEqual(preview?.missing, [{ type: 'host', value: 'www\\.manspick\\.co\\.kr' }]);
  for (const source of ['/:path*', '/recommend/:path*', '/api/:path*']) {
    assert.match(
      rules
        .find((rule) => rule.source === source)
        ?.headers.find((header) => header.key === 'X-Robots-Tag')?.value ?? '',
      /noindex/,
    );
  }
});

test('apex redirect preserves the original path and query on the canonical host', () => {
  assert.deepEqual(proxyConfig.matcher, [
    { source: '/:path*', has: [{ type: 'host', value: 'manspick\\.co\\.kr' }] },
  ]);
  const response = proxy(
    new Request('http://manspick.co.kr:3005/recommend?pkg=hybrid&utm_source=naver'),
  );
  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get('location'),
    `${productionOrigin}/recommend?pkg=hybrid&utm_source=naver`,
  );
});

test('old HTML addresses permanently redirect on the current site without losing package parameters', () => {
  const request = new Request(
    'https://preview.example.com/recommend.html?pkg=hybrid&utm_source=naver',
  );
  const response = legacyRedirect(request, '/recommend');
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), '/recommend?pkg=hybrid&utm_source=naver');
  assert.equal(
    legacyRedirect(new Request('https://manspick.kr/index.html'), '/').headers.get('location'),
    '/',
  );
});

test('structured data cannot terminate its JSON script element', () => {
  const serialized = serializeStructuredData({ name: '</script><script>alert(1)</script>' });
  assert.equal(serialized.includes('<'), false);
  assert.deepEqual(JSON.parse(serialized), { name: '</script><script>alert(1)</script>' });
});
