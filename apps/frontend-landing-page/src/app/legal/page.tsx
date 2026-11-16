// 이전 서비스 안내 주소를 원본 사이트의 이용약관으로 연결합니다.
import { permanentRedirect } from 'next/navigation';

export default function LegalPage() {
  permanentRedirect('/terms');
}
