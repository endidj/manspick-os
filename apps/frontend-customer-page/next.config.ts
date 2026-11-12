// 고객의 개인 링크를 외부 리퍼러와 검색 엔진에서 제외합니다.
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@manspick/design-system', '@manspick/domain', '@manspick/web'],
  async headers() {
    return [
      {
        source: '/s/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },
};

export default config;
