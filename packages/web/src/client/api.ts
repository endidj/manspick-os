// 브라우저에서 같은 앱의 API를 호출하고 서버가 보낸 오류를 일관되게 전달합니다.
export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set('Content-Type', 'application/json');
  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const result = (await response.json()) as {
    data?: T;
    error?: { code?: string; message?: string };
  };
  if (!response.ok || result.error)
    throw new ApiError(
      result.error?.code ?? 'NETWORK',
      result.error?.message ?? '요청을 처리하지 못했습니다.',
      response.status,
    );
  return result.data as T;
}

export const action = <T>(shootId: string, body: unknown) =>
  api<T>(`/shoots/${shootId}/actions`, { method: 'POST', body: JSON.stringify(body) });
