// 화면에 표시할 금액과 시간을 한국 원화와 서울 시간 기준으로 바꿉니다.
const seoulTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
});
const compactSeoulTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function money(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function dateTime(value: string | null, variant: 'long' | 'compact' = 'long') {
  if (!value) return '일정 선택 전';
  const date = new Date(value);
  if (variant !== 'compact') return seoulTime.format(date);
  const parts = Object.fromEntries(
    compactSeoulTime.formatToParts(date).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.month}/${parts.day} (${parts.weekday}) ${parts.hour}:${parts.minute}`;
}
