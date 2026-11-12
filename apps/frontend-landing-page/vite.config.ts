// 공개 사이트의 Vinext 개발 서버와 Workers 빌드를 설정합니다.
import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig({
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
});
