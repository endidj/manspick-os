// 브라우저 탭의 임의 식별자와 허용된 화면 동작만 전송합니다.
let fallbackId = '';

export function visitId() {
  try {
    const existing = sessionStorage.getItem('mp-visit');
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem('mp-visit', id);
    return id;
  } catch {
    return (fallbackId ||= crypto.randomUUID());
  }
}

export function trackEvent(
  event: string,
  detail: { channel?: string; section?: string; durationMs?: number } = {},
) {
  const body = JSON.stringify({
    id: crypto.randomUUID(),
    visitorId: visitId(),
    event,
    device: window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop',
    ...detail,
  });
  const endpoint = '/api/analytics/events';
  if (!navigator.sendBeacon?.(endpoint, new Blob([body], { type: 'application/json' })))
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {});
}
