// 대표 도메인 이동에서도 상품 선택과 유입 경로 쿼리를 보존합니다.
import { productionOrigin } from './features/seo/settings';

export function proxy(request: Request) {
  const url = new URL(request.url);
  const target = new URL(productionOrigin);
  url.protocol = target.protocol;
  url.host = target.host;
  url.port = target.port;
  return Response.redirect(url, 308);
}

export const config = {
  matcher: [{ source: '/:path*', has: [{ type: 'host', value: 'manspick\\.co\\.kr' }] }],
};
