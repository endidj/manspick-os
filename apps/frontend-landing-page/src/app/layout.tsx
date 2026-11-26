// 공개 페이지에 공통 메타데이터·폰트·기본 스타일을 적용합니다.
import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { semanticTokens } from '@manspick/design-system/tokens';
import '@manspick/design-system/styles/landing.css';
import { FontPreload, siteMetadata } from '../features/seo';
import { LandingAnalytics } from '../features/landing/landing-analytics';

export const metadata = siteMetadata;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: semanticTokens.color.background.base,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-manspick-landing>
      <head>
        <FontPreload family="body" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          본문으로 바로가기
        </a>
        {children}
        <LandingAnalytics />
      </body>
    </html>
  );
}
