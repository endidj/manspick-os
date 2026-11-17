// 검색 대표 주소와 실제 배포 주소를 구분해 페이지별 메타데이터를 만듭니다.
import type { Metadata } from 'next';
import { brandedPageTitle, resolveSiteSettings } from './settings';
import faviconUrl from './icons/favicon.ico?url';
import appleTouchIconUrl from './icons/apple-touch-icon.png?url';
import largeIconUrl from './icons/icon-256.png?url';

const settings = resolveSiteSettings(
  process.env.MANSPICK_SITE_ORIGIN,
  process.env.MANSPICK_SITE_INDEXABLE === 'true',
);

export const siteOrigin = settings.origin;
export const isSiteIndexable = settings.indexable;
const deploymentOrigin = process.env.MANSPICK_DEPLOYMENT_ORIGIN || siteOrigin;
export const socialImageUrl = new URL('/images/og-image.jpg', deploymentOrigin).href;
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
      ...(canIndex
        ? { 'max-image-preview': 'large' as const, 'max-snippet': -1, 'max-video-preview': -1 }
        : { noarchive: true, noimageindex: true }),
    },
    openGraph: {
      type: 'website',
      siteName: '맨즈픽 MANSPICK',
      locale: 'ko_KR',
      title: fullTitle,
      description,
      url: new URL(path, deploymentOrigin).href,
      images: [
        {
          url: socialImageUrl,
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
      images: [socialImageUrl],
    },
  };
}

export const siteMetadata: Metadata = {
  ...pageMetadata({ title: siteTitle, description: siteDescription, path: '/' }),
  metadataBase: new URL(siteOrigin),
  applicationName: '맨즈픽 MANSPICK',
  authors: [{ name: 'MANSPICK' }],
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: largeIconUrl, type: 'image/png', sizes: '256x256' },
      { url: faviconUrl, type: 'image/vnd.microsoft.icon', sizes: '16x16 32x32 48x48' },
    ],
    shortcut: faviconUrl,
    apple: { url: appleTouchIconUrl, type: 'image/png', sizes: '180x180' },
  },
  verification: {
    other: { 'naver-site-verification': '3a8644c743cbd24fbda9a9fe605e5c9f156b3e09' },
  },
};
