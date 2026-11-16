// 기존 이용약관 주소를 새 약관 페이지로 영구 이동합니다.
import { legacyRedirect } from '../../features/seo';

export function GET(request: Request) {
  return legacyRedirect(request, '/terms');
}
