// 공개 사이트의 검색 허용 범위와 구형 주소의 이동 계약을 검사합니다.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  brandedPageTitle,
  resolveSiteSettings,
  serializeStructuredData,
} from '../apps/frontend-landing-page/src/features/seo/settings.ts';
import { legacyRedirect } from '../apps/frontend-landing-page/src/features/seo/legacy-redirect.ts';

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

test('all origins stay non-indexable even when a previous opt-in is present', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_INDEXABLE;
  process.env.NEXT_PUBLIC_SITE_INDEXABLE = 'true';
  try {
    assert.deepEqual(resolveSiteSettings(), { origin: 'https://manspick.kr', indexable: false });
    assert.equal(resolveSiteSettings('https://manspick.kr/').indexable, false);
    assert.equal(resolveSiteSettings('https://www.manspick.kr/').origin, 'https://www.manspick.kr');
    for (const origin of [
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
      assert.equal(resolveSiteSettings(origin).indexable, false, origin);
    }
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_INDEXABLE;
    else process.env.NEXT_PUBLIC_SITE_INDEXABLE = previous;
  }
});

test('canonical settings reject invalid origins and strip paths, credentials and queries', () => {
  for (const origin of [
    'not a URL',
    'javascript:alert(1)',
    'ftp://example.com',
    'https://user:secret@manspick.kr',
  ]) {
    assert.deepEqual(resolveSiteSettings(origin), {
      origin: 'https://manspick.kr',
      indexable: false,
    });
  }
  assert.deepEqual(resolveSiteSettings(' https://manspick.kr/some-path?pkg=one#faq '), {
    origin: 'https://manspick.kr',
    indexable: false,
  });
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
