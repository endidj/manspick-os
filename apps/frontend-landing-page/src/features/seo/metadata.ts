// 페이지별 검색·공유 메타데이터를 동일한 운영 주소와 색인 정책으로 만듭니다.
import type { Metadata } from 'next';
import { brandedPageTitle, resolveSiteSettings } from './settings';

const settings = resolveSiteSettings(process.env.NEXT_PUBLIC_SITE_ORIGIN);

export const siteOrigin = settings.origin;
export const isSiteIndexable = settings.indexable;
export const siteTitle = '맨즈픽 MANSPICK | 남자 프로필사진·소개팅사진·이미지컨설팅';
export const siteDescription =
  '남성을 위한 프로필 사진과 이미지 컨설팅. 사전 스타일링부터 의상, 포즈 디렉팅, 촬영과 보정까지 맨즈픽과 함께 나다운 첫인상을 완성하세요.';

export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = new URL(path, siteOrigin).href;
  const canIndex = isSiteIndexable && index;
  const fullTitle = brandedPageTitle(title);
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    robots: {
      index: canIndex,
      follow: isSiteIndexable,
      noarchive: true,
      noimageindex: true,
      ...(canIndex && { 'max-image-preview': 'large' as const }),
    },
    openGraph: {
      type: 'website',
      siteName: '맨즈픽 MANSPICK',
      locale: 'ko_KR',
      title: fullTitle,
      description,
      url,
      images: [
        {
          url: `${siteOrigin}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: '맨즈픽 남성 프로필 사진과 이미지 컨설팅',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [`${siteOrigin}/images/og-image.jpg`],
    },
  };
}

export const siteMetadata: Metadata = {
  ...pageMetadata({ title: siteTitle, description: siteDescription, path: '/' }),
  metadataBase: new URL(siteOrigin),
  applicationName: '맨즈픽 MANSPICK',
  authors: [{ name: 'MANSPICK' }],
  formatDetection: { telephone: false },
  icons: { icon: '/favicon.ico' },
  verification: {
    other: { 'naver-site-verification': '3a8644c743cbd24fbda9a9fe605e5c9f156b3e09' },
  },
};
