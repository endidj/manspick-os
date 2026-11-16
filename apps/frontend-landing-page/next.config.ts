// Vinext에서 읽는 공개 사이트의 Next.js 호환 설정입니다.
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@manspick/design-system', '@manspick/domain', '@manspick/web'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, noimageindex' }],
      },
    ];
  },
};

export default config;
