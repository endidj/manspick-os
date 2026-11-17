// 운영 주소와 검색 허용 여부를 검증하고 구조화 데이터를 안전하게 직렬화합니다.
export const productionOrigin = 'https://www.manspick.co.kr';

export function brandedPageTitle(title: string) {
  return title.includes('맨즈픽 MANSPICK') ? title : `${title} | 맨즈픽 MANSPICK`;
}

export function resolveSiteSettings(origin?: string, indexable = false) {
  try {
    const url = new URL(origin?.trim() || productionOrigin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('A public HTTP origin is required.');
    }
    return {
      origin: url.origin,
      // 운영 빌드와 확인된 대표 주소가 모두 일치할 때만 검색을 허용합니다.
      indexable: indexable && url.origin === productionOrigin,
    };
  } catch {
    return { origin: productionOrigin, indexable: false };
  }
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
