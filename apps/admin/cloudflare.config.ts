// 관리자 Worker의 정적 파일과 로컬 API 서비스 연결을 설정합니다.
import { bindings, defineConfig, defineWorker } from 'cf/config';

export default defineConfig({
  worker: defineWorker(() => ({
    name: 'manspick-admin',
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
        worker: 'manspick-api-local',
      }),
    },
  })),
});
