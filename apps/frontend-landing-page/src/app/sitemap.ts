// 검색에 공개할 대표 페이지의 정규 주소만 사이트맵에 제공합니다.
import type { MetadataRoute } from 'next';
import { isSiteIndexable, siteOrigin } from '../features/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable) return [];
  return [
    {
      url: `${siteOrigin}/`,
      changeFrequency: 'weekly',
      priority: 1,
      images: [`${siteOrigin}/images/og-smartstore-11725751378-wide.jpg`],
    },
    { url: `${siteOrigin}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteOrigin}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
