// 기존 패키지 링크의 선택값을 유지해 추천 페이지로 영구 이동합니다.
import { legacyRedirect } from '../../features/seo';

export function GET(request: Request) {
  return legacyRedirect(request, '/recommend');
}
