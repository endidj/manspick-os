// 개인 링크의 고객 인증 화면을 연결합니다.
import { CustomerApp } from '../../../features/customer';
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <CustomerApp key={token} token={token} />;
}
