// 주소의 촬영 식별자를 운영 상세 화면에 전달합니다.
import { AdminApp } from '../../../features/workspace';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminApp initialShootId={id} />;
}
