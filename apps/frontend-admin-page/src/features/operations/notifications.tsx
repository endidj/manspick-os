// 운영 권한으로 실제 로컬 알림 기록을 조회하고 실패하면 다시 시도합니다.
import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
} from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { dateTime } from '@manspick/web/format';
import { api } from '@manspick/web/client';
import styles from './operations.module.css';

type Notification = {
  id: string;
  shootId: string;
  kind: string;
  body: string;
  state: string;
  sendAt: string | null;
};

export function Notifications() {
  const [items, setItems] = useState<Notification[]>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems((await api<{ items: Notification[] }>('/notifications')).items);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api<{ items: Notification[] }>('/notifications')
      .then((result) => setItems(result.items))
      .catch((cause) => setError((cause as Error).message));
  }, []);

  return (
    <div className={styles.stack}>
      <Notice>로컬 발송 대기 기록입니다. ‘대기’는 실제 발송 성공을 의미하지 않습니다.</Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <div className={styles.toolbar}>
        <Button size="sm" variant="secondary" loading={loading} onClick={refresh}>
          다시 불러오기
        </Button>
      </div>
      {!items ? (
        !error && <Loading />
      ) : (
        <Panel>
          {items.length ? (
            items.map((item) => (
              <div className={styles.notification} key={item.id}>
                <Icon name="chat" size={18} />
                <div className={styles.notificationContent}>
                  <strong>{item.kind || '진행 안내'}</strong>
                  <p>{item.body}</p>
                  <span>{item.sendAt ? dateTime(item.sendAt) : '예약 발송 시각 없음'}</span>
                </div>
                <Badge tone="amber">{item.state}</Badge>
              </div>
            ))
          ) : (
            <EmptyState title="발송 대기 기록이 없습니다" />
          )}
        </Panel>
      )}
    </div>
  );
}
