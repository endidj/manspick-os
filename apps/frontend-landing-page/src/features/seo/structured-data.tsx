// 원본 사이트에 공개된 사업자 정보만 검색엔진용 JSON-LD로 제공합니다.
import { marketingIncludes, marketingPackages } from '../package-quiz/marketing-offers';
import { siteDescription, siteOrigin, socialImageUrl } from './metadata';
import { serializeStructuredData } from './settings';

export function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${siteOrigin}/#webpage`,
        url: `${siteOrigin}/`,
        name: '남자 프로필사진·소개팅사진·이미지컨설팅 | 맨즈픽 MANSPICK',
        description: siteDescription,
        inLanguage: 'ko-KR',
        isPartOf: { '@id': `${siteOrigin}/#website` },
        about: { '@id': `${siteOrigin}/#business` },
        mainEntity: { '@id': `${siteOrigin}/#service` },
      },
      {
        '@type': 'WebSite',
        '@id': `${siteOrigin}/#website`,
        url: `${siteOrigin}/`,
        name: '맨즈픽 MANSPICK',
        inLanguage: 'ko-KR',
        publisher: { '@id': `${siteOrigin}/#business` },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${siteOrigin}/#business`,
        name: '맨즈픽 MANSPICK',
        alternateName: 'MANSPICK',
        description: siteDescription,
        url: `${siteOrigin}/`,
        image: socialImageUrl,
        email: 'wook971215@gmail.com',
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '11:00',
          closes: '21:00',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: '양천로 94, G85호(염창동)',
          addressLocality: '강서구',
          addressRegion: '서울특별시',
          addressCountry: 'KR',
        },
        sameAs: [
          'https://www.instagram.com/we.are.manspick/',
          'https://pf.kakao.com/_kNxoMn',
          'https://smartstore.naver.com/_manspick',
        ],
        hasMap: 'https://naver.me/GipSFyDX',
        hasOfferCatalog: { '@id': `${siteOrigin}/#packages` },
      },
      {
        '@type': 'Service',
        '@id': `${siteOrigin}/#service`,
        name: '남성 프로필 사진 촬영 및 이미지 컨설팅',
        url: `${siteOrigin}/#pricing`,
        provider: { '@id': `${siteOrigin}/#business` },
        areaServed: ['서울특별시', '경기도'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          '@id': `${siteOrigin}/#packages`,
          name: '맨즈픽 촬영 패키지',
          itemListElement: marketingPackages.map((pack) => ({
            '@type': 'Offer',
            name: `${pack.name} 패키지`,
            price: pack.price,
            priceCurrency: 'KRW',
            url: `${siteOrigin}/#pricing`,
            itemOffered: {
              '@type': 'Service',
              name: `${pack.name} 패키지`,
              description: marketingIncludes[pack.id].join(' · '),
              provider: { '@id': `${siteOrigin}/#business` },
            },
          })),
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(data) }}
    />
  );
}
