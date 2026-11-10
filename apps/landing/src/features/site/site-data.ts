// 공개 앱의 이동 주소와 상품 구성 표시 형식을 정합니다.
import type { PackageDTO } from '@manspick/contracts';

const customerOrigin = process.env.NEXT_PUBLIC_CUSTOMER_APP_ORIGIN?.trim().replace(/\/+$/, '');
export const localBooking = !customerOrigin;
export const bookingUrl = `${customerOrigin || 'http://localhost:3001'}/start`;
export const adminAppUrl =
  process.env.NEXT_PUBLIC_ADMIN_APP_ORIGIN?.trim() || 'http://localhost:3002';

export function packageFacts(item: PackageDTO) {
  return {
    duration: item.duration % 60 === 0 ? `${item.duration / 60}시간` : `${item.duration}분`,
    outfits: `의상 ${item.outfits}벌`,
    photos: `보정 ${item.retouchCount}장`,
  };
}
