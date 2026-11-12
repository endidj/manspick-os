// 공개 사이트 Worker의 정적 파일과 API 서비스 연결을 설정합니다.
import { bindings, defineConfig, defineWorker } from 'cf/config';

export default defineConfig({
  worker: defineWorker(({ mode }) => ({
    name: mode === 'test' ? 'manspick-landing-test' : 'manspick-landing',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-11-06',
    compatibilityFlags: ['nodejs_compat'],
    assets: {
      htmlHandling: 'none',
      notFoundHandling: 'none',
      runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'],
    },
    env: {
      ASSETS: bindings.assets(),
      MANSPICK_API: bindings.worker({
        worker: mode === 'test' ? 'manspick-public-api-test' : 'manspick-api-local',
      }),
    },
    ...(mode === 'test' && {
      workersDev: true,
      previewUrls: false,
      observability: { enabled: false },
    }),
  })),
});
