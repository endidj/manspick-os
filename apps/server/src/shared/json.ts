// 저장된 JSON이 없거나 잘못되었을 때 기본값으로 읽습니다.

export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}
