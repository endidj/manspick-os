// 기존 정적 사이트 주소를 검색 매개변수를 보존하며 새 React 경로로 이동합니다.
export function legacyRedirect(
  request: Request,
  pathname: '/' | '/recommend' | '/terms' | '/privacy',
) {
  return new Response(null, {
    status: 308,
    headers: { Location: `${pathname}${new URL(request.url).search}` },
  });
}
