// 요청 식별자와 공개 가능한 오류 정보만 운영 로그에 남깁니다.
type ErrorEvent = 'api_failure' | 'staff_login_email_send_failed';

export function logError(
  request: Request,
  event: ErrorEvent,
  fields?: { status?: number; code?: string },
) {
  const ray = request.headers.get('CF-Ray');
  const requestId = ray && /^[a-f\d]{16}-[A-Z]{3}$/i.test(ray) ? ray : crypto.randomUUID();
  console.error(
    JSON.stringify({
      event,
      requestId,
      method: request.method,
      status: fields?.status,
      code: fields?.code,
    }),
  );
  return requestId;
}
