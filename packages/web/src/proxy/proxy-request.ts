// Next 앱의 요청을 API Worker로 전달하고 응답의 보안·캐시 헤더를 정리합니다.

export async function proxyRequest(request: Request, surface: string): Promise<Response> {
  const url = new URL(request.url);
  if (surface === 'landing' && !['/api/catalog', '/api/health'].includes(url.pathname)) {
    return Response.json(
      { error: { code: 'FORBIDDEN', message: '공개 사이트에서는 업무 API를 사용할 수 없습니다.' } },
      { status: 403 },
    );
  }
  const headers = new Headers(request.headers);
  headers.set('X-Manspick-Surface', surface);
  for (const name of [
    'host',
    'connection',
    'transfer-encoding',
    'keep-alive',
    'te',
    'trailer',
    'upgrade',
    'expect',
  ])
    headers.delete(name);
  headers.set('accept-encoding', 'identity');
  const body = ['GET', 'HEAD'].includes(request.method) ? null : request.body;
  // Node's fetch requires duplex for an incoming request stream. The API applies its own limits.
  const forwarded: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    ...(body ? { body, duplex: 'half' } : {}),
  };
  try {
    let response: Response;
    if (process.env.MANSPICK_LOCAL_API === 'true') {
      const backend = new URL(url.pathname + url.search, 'http://127.0.0.1:8787');
      response = await fetch(backend, {
        ...forwarded,
        redirect: 'manual',
        cache: 'no-store',
      });
    } else {
      // Node 테스트는 로컬 HTTP 경로를 사용하므로 Worker 모듈을 불러오지 않습니다.
      const { env } = await import('cloudflare:workers');
      const binding = (env as { MANSPICK_API?: Fetcher }).MANSPICK_API;
      if (!binding) throw new Error('API service binding is not configured');
      response = await binding.fetch(new Request(request.url, forwarded));
    }
    const outgoing = new Headers(response.headers);
    // fetch decodes an upstream compressed body; do not label that decoded stream as gzip.
    outgoing.delete('content-encoding');
    outgoing.delete('content-length');
    outgoing.delete('transfer-encoding');
    outgoing.set('Cache-Control', 'private, no-store');
    outgoing.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch {
    return Response.json(
      {
        error: {
          code: 'API_UNAVAILABLE',
          message: '업무 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
