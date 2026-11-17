// Vinext에서 읽는 공개 사이트의 Next.js 호환 설정입니다.
import type { NextConfig } from 'next';
import { productionOrigin } from './src/features/seo/settings.ts';

const productionHost = new URL(productionOrigin).hostname.replaceAll('.', '\\.');
const excluded = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noimageindex' }];

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@manspick/design-system', '@manspick/domain', '@manspick/web'],
  async headers() {
    return [
      {
        source: '/:path*',
        missing: [{ type: 'host', value: productionHost }],
        headers: excluded,
      },
      ...['/recommend/:path*', '/api/:path*'].map((source) => ({ source, headers: excluded })),
      // SSG는 배포별 ASSETS 캐시에서 재사용하고, 고정 페이지 URL은 최신 배포를 확인합니다.
      ...['/', '/terms', '/privacy'].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      })),
    ];
  },
};

export default config;
