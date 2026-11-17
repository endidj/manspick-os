// 검색에 공개할 대표 페이지의 정규 주소만 사이트맵에 제공합니다.
import type { MetadataRoute } from 'next';
import { sourceImages } from '@manspick/design-system/assets';
import { isSiteIndexable, siteOrigin } from '../features/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!isSiteIndexable) return [];
  return [
    {
      url: `${siteOrigin}/`,
      // 본문·구조화 데이터가 실제로 바뀐 날만 갱신하며 빌드 날짜를 사용하지 않습니다.
      lastModified: '2026-11-17',
      changeFrequency: 'weekly',
      priority: 1,
      images: [
        `${siteOrigin}/images/og-smartstore-11725751378-wide.jpg`,
        ...(['location-1.jpg', 'location-2.jpg', 'location-3.jpg'] as const).map(
          (name) => new URL(sourceImages[name].src, siteOrigin).href,
        ),
      ],
    },
    { url: `${siteOrigin}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteOrigin}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
