// 촬영별 할 일을 완료하고 운영 중인 캠페인에 고객 예약을 등록합니다.
import { useState } from 'react';
import { Button, Panel } from '@manspick/design-system/components';
import { TextField } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import type { PerformAction } from './use-shoot-detail';

export function BookingOperations({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [title, setTitle] = useState('');
  return (
    <Panel>
      <h3>촬영 할 일</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!busy && title.trim() && (await perform({ type: 'add_task', title }))) setTitle('');
        }}
      >
        <TextField label="새 할 일" value={title} onValueChange={setTitle} maxLength={200} />
        <Button type="submit" disabled={busy || !title.trim()}>
          추가
        </Button>
      </form>
      {(shoot.tasks ?? []).map((t) => (
        <div key={t.id}>
          {t.title} · {t.assignee}
          {t.completedAt ? (
            ' · 완료'
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void perform({ type: 'complete_task', taskId: t.id })}
            >
              완료 처리
            </Button>
          )}
        </div>
      ))}
      {shoot.capabilities.includes('enter_campaign') && Boolean(shoot.campaigns?.length) && (
        <>
          <h3>캠페인 참여</h3>
          {shoot.campaigns?.map((c) => (
            <div key={c.id}>
              {c.name}{' '}
              {c.entered ? (
                '참여 중'
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void perform({ type: 'enter_campaign', campaignId: c.id })}
                >
                  참여 등록
                </Button>
              )}
            </div>
          ))}
        </>
      )}
    </Panel>
  );
}
