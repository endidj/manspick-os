// 조건에 맞는 안내 문구와 알림 기록을 읽고 직원의 수동 발송 완료만 저장합니다.
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
  TemplateBlock,
} from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import type { MessageTemplateDTO } from '@manspick/contracts';
import type { StaffRole } from '@manspick/domain';
import { api } from '@manspick/web/client';
import styles from './shoot-detail.module.css';

type Message = { id: string; shootId: string; kind: string; body: string; state: string };
type Messages = {
  items: Message[];
  templates: (MessageTemplateDTO & {
    renderedBody: string;
    notificationId: string | null;
    sent: boolean;
  })[];
};

export function ShootMessages({ shootId, role = 'staff' }: { shootId: string; role?: StaffRole }) {
  const [data, setData] = useState<Messages>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const path = `/shoots/${encodeURIComponent(shootId)}/messages`;
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api<Messages>(path));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    let active = true;
    api<Messages>(path)
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [path]);

  async function confirm(templateKey: string) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await api(`${path}/${encodeURIComponent(templateKey)}/complete`, {
        method: 'POST',
        body: '{}',
      });
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmNotification(id: string) {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await api(`/notifications/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        body: '{}',
      });
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const records = data?.items.filter((item) => !item.kind.startsWith('template:')) ?? [];
  return (
    <Panel className={`${styles.stackSmall} ${styles.summaryPanel}`} aria-busy={saving}>
      <div className={styles.sectionHeading}>
        <h3 className={styles.panelTitle}>
          <Icon name="chat" size={18} />
          알림 · 알림톡 템플릿
        </h3>
        <Button size="sm" variant="ghost" loading={loading} onClick={refresh}>
          새로고침
        </Button>
      </div>
      <p className={styles.caption}>
        현재 단계·패키지·부가서비스·직원 역할에 맞는 활성 안내만 표시합니다. 카카오채널에서 직접
        발송한 뒤 완료를 기록하세요.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      {!data ? (
        !error && <Loading />
      ) : (
        <>
          {data.templates.map((template) => (
            <TemplateBlock
              key={template.key}
              title={template.title}
              message={template.renderedBody}
              recommendation={template.sent ? '수동 발송 완료' : '발송 대기'}
              sent={template.sent}
              onSentChange={
                template.sent || saving
                  ? undefined
                  : (sent) => {
                      if (sent) void confirm(template.key);
                    }
              }
              variableHint="복사와 수동 발송 기록은 별개이며 자동 발송하지 않습니다."
            />
          ))}
          {records.map((item) => (
            <TemplateBlock
              key={item.id}
              title={item.kind || '진행 안내'}
              message={item.body}
              recommendation={item.state === 'manually_confirmed' ? '수동 발송 완료' : '발송 대기'}
              sent={item.state === 'manually_confirmed'}
              onSentChange={
                role === 'director' || item.state === 'manually_confirmed' || saving
                  ? undefined
                  : (sent) => {
                      if (sent) void confirmNotification(item.id);
                    }
              }
              variableHint="기존 촬영 알림 기록입니다. 외부 발송은 직접 처리합니다."
            />
          ))}
          {!data.templates.length && !records.length && (
            <EmptyState
              title="현재 조건에 맞는 안내가 없습니다"
              description="활성 템플릿의 단계·패키지·옵션·발송 담당 조건을 확인해주세요."
            />
          )}
        </>
      )}
    </Panel>
  );
}
