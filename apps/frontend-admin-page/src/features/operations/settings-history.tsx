// 설정과 직원 계정의 변경 전후 값과 담당자를 확인하는 대화상자입니다.
import { useState } from 'react';
import { Button, EmptyState, Loading, Notice } from '@manspick/design-system/components';
import { Dialog } from '@manspick/design-system/patterns';
import type { SettingsHistoryEntryDTO } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { dateTime } from '@manspick/web/format';
import styles from './settings-history.module.css';

const staffActions: Readonly<Record<string, string>> = {
  create: '직원 등록',
  update: '직원 권한·상태 변경',
  revoke_sessions: '직원 세션 종료',
};

export function SettingsHistory() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SettingsHistoryEntryDTO[]>();
  const [error, setError] = useState('');

  async function load() {
    setOpen(true);
    setItems(undefined);
    setError('');
    try {
      setItems((await api<{ items: SettingsHistoryEntryDTO[] }>('/settings/history')).items);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={load}>
        변경 이력
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="설정 변경 이력"
        description="최근 100건 · 설정·템플릿·직원 계정 변경과 저장 담당자를 확인합니다."
      >
        {error ? (
          <Notice tone="error">
            {error}
            <Button variant="ghost" size="sm" onClick={load}>
              다시 불러오기
            </Button>
          </Notice>
        ) : !items ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState title="변경 이력이 없습니다" />
        ) : (
          items.map((item) => (
            <article className={styles.entry} key={item.id}>
              <strong>
                {item.settingKey.startsWith('staff:')
                  ? `${staffActions[item.action ?? ''] ?? '직원 계정 변경'} · ${item.targetName ?? item.settingKey.slice('staff:'.length)}`
                  : item.settingKey}
              </strong>
              <span>
                {item.actorName} · {dateTime(item.createdAt)}
              </span>
              <details>
                <summary>변경 전</summary>
                <pre>{JSON.stringify(item.previous, null, 2)}</pre>
              </details>
              <details>
                <summary>변경 후</summary>
                <pre>{JSON.stringify(item.next, null, 2)}</pre>
              </details>
            </article>
          ))
        )}
      </Dialog>
    </>
  );
}
