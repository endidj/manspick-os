// 촬영 일정과 패키지 이름을 고객 원본의 짧은 문구로 표시합니다.
import type { ShootDetail } from '@manspick/contracts';

export function shootDate(value: string | null, includeTime = false) {
  if (!value) return '일정 확인 중';
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  const day = `${part('month')}/${part('day')} (${part('weekday')})`;
  return includeTime ? `${day} ${shootTime(value)}` : day;
}

export function shootTime(value: string | null) {
  if (!value) return '시간 확인 중';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function packageName(id: string, snapshotName?: string) {
  if (snapshotName) return snapshotName;
  return (
    ({ one: '원', hybrid: '하이브리드', allday: '올데이' } as Record<string, string>)[id] ?? id
  );
}

export function packageSummary(
  shoot: Pick<ShootDetail, 'packageId' | 'addons'> & Partial<Pick<ShootDetail, 'package'>>,
) {
  return [
    packageName(shoot.packageId, shoot.package?.name),
    ...shoot.addons.filter((a) => a.quantity > 0).map((a) => a.name),
  ].join(' · ');
}
