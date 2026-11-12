// Node HTTP에는 라우팅 정보만 보내고 원본 본문은 인증 뒤 Fetch 파서가 한 번만 읽습니다.
export function routingRequest(request: Request) {
  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  return new Request(request.url, {
    method: request.method,
    headers,
    signal: request.signal,
  });
}
