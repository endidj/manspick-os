// 공개 테스트는 예약 시작으로 보내고 로컬에서는 샘플 고객 홈을 연결합니다.
import { redirect } from 'next/navigation';
import { DemoHome } from '../features/customer';

export default function Page() {
  if (process.env.MANSPICK_PUBLIC_TEST === 'true') redirect('/start');
  return <DemoHome />;
}
