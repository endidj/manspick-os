// 검색 제외 지시를 읽도록 수집을 허용하고 공개 빌드의 사이트맵을 알립니다.
import type { MetadataRoute } from 'next';
import { isSiteIndexable, siteOrigin } from '../features/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(isSiteIndexable && { sitemap: `${siteOrigin}/sitemap.xml` }),
  };
}
