// 예약 화면과 공개 URL의 대응을 서버와 브라우저에서 함께 사용합니다.
export const bookingPaths = ['/start', '/start/details', '/start/schedule', '/start/complete'];

export function bookingStep(path: string) {
  const index = bookingPaths.indexOf(path.replace(/\/$/, ''));
  return index < 0 ? null : index + 1;
}
