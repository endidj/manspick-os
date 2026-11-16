// 공개 사이트의 Vinext 개발 서버와 Workers 빌드를 설정합니다.
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN': JSON.stringify(
      process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN || '',
    ),
    'process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN': JSON.stringify(
      process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN || '',
    ),
    'process.env.NEXT_PUBLIC_SITE_ORIGIN': JSON.stringify(
      process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://manspick.kr',
    ),
    ...(mode === 'test'
      ? {
          'process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN': JSON.stringify(
            'https://manspick-customer-test.winningant8.workers.dev',
          ),
          'process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN': JSON.stringify(
            'https://manspick-admin-test.winningant8.workers.dev',
          ),
        }
      : {}),
  },
  // SSR과 브라우저에서 같은 아이콘 URL을 사용해 hydration 불일치를 막습니다.
  build: { assetsInlineLimit: 0 },
  plugins: [
    vinext(),
    cloudflare({
      // 여러 Worker를 동시에 켤 때 OS가 디버거 포트를 각각 배정합니다.
      inspectorPort: 0,
      viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
      // Workers 런타임 타입은 tsconfig에서 @cloudflare/workers-types로 가져옵니다.
      types: { includeRuntime: false },
    }),
  ],
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
}));
