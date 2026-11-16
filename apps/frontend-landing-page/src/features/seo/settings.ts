// 운영 주소와 검색 허용 여부를 검증하고 구조화 데이터를 안전하게 직렬화합니다.
const productionOrigin = 'https://manspick.kr';

export function brandedPageTitle(title: string) {
  return title.includes('맨즈픽 MANSPICK') ? title : `${title} | 맨즈픽 MANSPICK`;
}

export function resolveSiteSettings(origin?: string) {
  try {
    const url = new URL(origin?.trim() || productionOrigin);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('A public HTTP origin is required.');
    }
    return {
      origin: url.origin,
      // 검색 공개는 사용자가 다시 요청할 때 코드와 배포 설정을 함께 변경합니다.
      indexable: false,
    };
  } catch {
    return { origin: productionOrigin, indexable: false };
  }
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
