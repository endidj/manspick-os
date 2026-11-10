// API Worker에 연결된 저장소와 로컬 시연 환경인지 확인하는 방법을 정의합니다.

export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  LOCAL_DEMO?: string;
  EMAIL?: {
    send(message: { to: string; from: string; subject: string; text: string }): Promise<unknown>;
  };
  STAFF_EMAIL_FROM?: string;
  STAFF_EMAIL_DOMAIN?: string;
  STAFF_APP_ORIGIN?: string;
  CUSTOMER_APP_ORIGIN?: string;
  // 비공개 테스트 Worker가 관리자 앱의 요청에만 설정합니다.
  ADMIN_TEST?: boolean;
}

export function appOrigin(value: string | undefined, allowLocal = false) {
  try {
    const url = new URL(value ?? '');
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (url.protocol === 'https:') return url.origin;
    if (
      allowLocal &&
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
      return url.origin;
  } catch {
    return null;
  }
  return null;
}

export function localDemo(request: Request, env: Env) {
  return (
    env.LOCAL_DEMO === 'true' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(new URL(request.url).hostname)
  );
}

export function isAdminTestRequest(request: Request, env: Env) {
  return (
    env.ADMIN_TEST === true &&
    request.headers.get('X-Manspick-Surface') === 'admin' &&
    new URL(request.url).protocol === 'https:'
  );
}
