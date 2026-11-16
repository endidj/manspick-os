// 신규 촬영 접수 화면을 연결합니다.
import { notFound } from 'next/navigation';
import { Booking } from '../../../features/booking';
import { bookingStep } from '../../../features/booking/routes';

export default async function Page({ params }: { params: Promise<{ step?: string[] }> }) {
  const { step = [] } = await params;
  if (!bookingStep(`/start${step.length ? `/${step.join('/')}` : ''}`)) notFound();
  return <Booking />;
}
