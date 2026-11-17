// 공개 사이트의 Vinext 개발 서버와 Workers 빌드를 설정합니다.
import { cloudflare } from '@cloudflare/vite-plugin';
import { staticAssetsAdapter } from '@vinext/cloudflare/cache/static-assets-adapter';
import { defineConfig } from 'vite';
import vinext from 'vinext';
import { resolveSiteSettings } from './src/features/seo/settings.ts';

export default defineConfig(({ command, mode }) => {
  const site = resolveSiteSettings(
    process.env.NEXT_PUBLIC_SITE_ORIGIN,
    command === 'build' && mode === 'production',
  );
  return {
    define: {
      'process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN': JSON.stringify(
        process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN || '',
      ),
      'process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN': JSON.stringify(
        process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN || '',
      ),
      // Vinext의 NEXT_PUBLIC_* 자동 주입이 빌드의 검색 정책을 덮어쓰지 않게 합니다.
      'process.env.MANSPICK_SITE_ORIGIN': JSON.stringify(site.origin),
      'process.env.MANSPICK_SITE_INDEXABLE': JSON.stringify(String(site.indexable)),
      'process.env.MANSPICK_DEPLOYMENT_ORIGIN': JSON.stringify(
        mode === 'test' ? 'https://manspick-landing-test.winningant8.workers.dev' : site.origin,
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
      vinext({
        // 공개 고정 화면을 빌드 때 만들고 ASSETS에서 제공합니다. 동적 경로는 SSR을 유지합니다.
        prerender: { routes: '*', concurrency: 1 },
        cache: { cdn: staticAssetsAdapter() },
      }),
      cloudflare({
        // 여러 Worker를 동시에 켤 때 OS가 디버거 포트를 각각 배정합니다.
        inspectorPort: 0,
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        // Workers 런타임 타입은 tsconfig에서 @cloudflare/workers-types로 가져옵니다.
        types: { includeRuntime: false },
      }),
    ],
    server: { host: '127.0.0.1', port: 3000, strictPort: true },
  };
});
