// 관리자 Worker의 정적 파일과 모드별 API 서비스 연결을 설정합니다.
import { bindings, defineConfig, defineWorker } from 'cf/config';

export default defineConfig({
  worker: defineWorker(({ mode }) => {
    const test = mode === 'test';
    return {
      name: test ? 'manspick-admin-test' : 'manspick-admin',
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
          worker: test ? 'manspick-api-test' : 'manspick-api-local',
        }),
      },
      ...(test && {
        workersDev: true,
        previewUrls: false,
        observability: { enabled: false },
      }),
    };
  }),
});
