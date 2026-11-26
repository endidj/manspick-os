// 소셜 인증 후 같은 브라우저에서 시작했던 예약으로 돌아갑니다.
import { notFound } from 'next/navigation';
import { SocialReturn } from '../../../features/customer/social-return';

export default async function Page({ params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (provider !== 'kakao' && provider !== 'google') notFound();
  return <SocialReturn provider={provider} />;
}
