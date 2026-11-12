// Vinext에서 읽는 관리자 앱의 Next.js 호환 설정입니다.
import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@manspick/design-system', '@manspick/domain', '@manspick/web'],
};

export default config;
