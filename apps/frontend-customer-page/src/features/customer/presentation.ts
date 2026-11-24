// 촬영 일정과 패키지 이름을 고객 원본의 짧은 문구로 표시합니다.
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';

const prepaidChannels: Record<string, string> = {
  kmong: '크몽',
  frip: '프립',
  soomgo: '숨고',
  smartstore: '스마트스토어',
};

export function isOutfitGuide(guide: { id: string; title: string }) {
  return /outfit/i.test(guide.id) || /의상.*(사진|준비)|^의상$/.test(guide.title);
}

export function prepaidPlatform(channel: string | undefined): string | undefined {
  return channel && Object.hasOwn(prepaidChannels, channel) ? prepaidChannels[channel] : undefined;
}

export function reviewState(
  shoot: Pick<ShootDetail, 'requests' | 'fileLinks' | 'originals' | 'status'>,
) {
  if (shoot.originals.length || shoot.fileLinks.some((link) => link.kind === 'original'))
    return 'open';
  const request = shoot.requests.find((item) => item.type === 'review');
  if (
    request?.state === 'complete' ||
    ['review_confirmed', 'originals_pending', 'originals_delivered', 'follow_up'].includes(
      shoot.status,
    )
  )
    return 'approved';
  if (request?.state === 'new' || request?.state === 'processing') return 'pending';
  return request?.state === 'rejected' ? 'rejected' : 'available';
}

export function shootSchedule(shoot: ShootDetail) {
  if (!shoot.startsAt) return '일정 확인 중';
  const start = dateTime(shoot.startsAt, 'compact');
  if (!shoot.package.duration) return start;
  const end = new Date(Date.parse(shoot.startsAt) + shoot.package.duration * 60000);
  const endTime = end.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${start} – ${endTime}`;
}

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

export function shootTime(value: string | null, format: 'display' | '24h' = 'display') {
  if (!value) return '시간 확인 중';
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: format === '24h' ? '2-digit' : 'numeric',
    ...(format === '24h' && { hourCycle: 'h23' }),
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
  ].join(' + ');
}
