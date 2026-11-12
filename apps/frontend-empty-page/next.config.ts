// 공용 디자인 시스템을 포함해 배포용 정적 파일을 빌드합니다.
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  transpilePackages: ['@manspick/design-system'],
  turbopack: {
    rules: {
      '*.svg': { condition: { query: '?url' }, type: 'asset' },
    },
  },
};

export default config;
