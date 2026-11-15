// 개인 링크의 고객 인증 화면을 연결합니다.
import { notFound } from 'next/navigation';
import { CustomerApp } from '../../../../features/customer';
import { customerRoute } from '../../../../features/customer/routes';

export default async function Page({
  params,
}: {
  params: Promise<{ token: string; step?: string[] }>;
}) {
  const { token, step = [] } = await params;
  if (!customerRoute(step)) notFound();
  return <CustomerApp key={token} token={token} />;
}
