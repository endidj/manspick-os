// 저장용 식별자와 로그인 토큰을 만들고 토큰을 해시합니다.

export function id() {
  return crypto.randomUUID();
}

export async function hash(value: string | ArrayBuffer) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

export function randomToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}
