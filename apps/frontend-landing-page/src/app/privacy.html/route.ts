// 기존 개인정보처리방침 주소를 새 정책 페이지로 영구 이동합니다.
import { legacyRedirect } from '../../features/seo';

export function GET(request: Request) {
  return legacyRedirect(request, '/privacy');
}
