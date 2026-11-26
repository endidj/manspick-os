// 현재 직원에게 배정된 촬영의 개인 알림을 확인합니다.
import { useEffect, useState } from 'react';
import { api } from '@manspick/web/client';
import { Panel, Notice } from '@manspick/design-system/components';
import { dateTime } from '@manspick/web/format';

type Message = { id: string; body: string; status: string; createdAt: string };
export function StaffInbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const stop = new AbortController();
    api<{ items: Message[] }>('/staff/inbox', { signal: stop.signal })
      .then((r) => setMessages(r.items.filter((m) => m.status !== 'cancelled')))
      .catch((e: Error) => {
        if (!stop.signal.aborted) setError(e.message);
      });
    return () => stop.abort();
  }, []);
  return (
    <Panel>
      <h2>내 담당 촬영 알림</h2>
      {error && <Notice>{error}</Notice>}
      {!error && !messages.length && <p>배정된 촬영의 알림이 없습니다.</p>}
      {messages.map((m) => (
        <p key={m.id}>
          {m.body} · {dateTime(m.createdAt)} ·{' '}
          {m.status === 'pending'
            ? '카카오 발송 대기'
            : m.status === 'sent'
              ? '발송 완료'
              : '발송 실패'}
        </p>
      ))}
    </Panel>
  );
}
