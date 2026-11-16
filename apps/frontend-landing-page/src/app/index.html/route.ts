// 이전 메인 페이지 주소를 새 홈으로 영구 이동합니다.
import { legacyRedirect } from '../../features/seo';

export function GET(request: Request) {
  return legacyRedirect(request, '/');
}
