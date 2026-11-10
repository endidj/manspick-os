// 화면에 표시할 금액과 시간을 한국 원화와 서울 시간 기준으로 바꿉니다.
export function money(value: number) {
  return `${value.toLocaleString('ko-KR')}원`;
}

export function dateTime(value: string | null, variant: 'long' | 'compact' = 'long') {
  if (!value) return '일정 선택 전';
  if (variant === 'compact') {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date(value))
        .map(({ type, value: part }) => [type, part]),
    );
    return `${parts.month}/${parts.day} (${parts.weekday}) ${parts.hour}:${parts.minute}`;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}
