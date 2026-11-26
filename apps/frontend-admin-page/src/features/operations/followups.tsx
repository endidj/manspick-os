// 실제 후속 혜택과 고객 요청을 조회하고 직원의 확인·반려를 저장합니다.
import { useEffect, useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import { Badge, Button, Loading, Notice, Panel } from '@manspick/design-system/components';
import { Dialog, InfoRow, TextField } from '@manspick/design-system/patterns';
import type { OperationsSettingsDTO } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { money } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import styles from './management.module.css';

type Campaign = OperationsSettingsDTO['campaigns'][number];
type FollowupsData = {
  campaigns: Campaign[];
};

export function Followups({ role }: { role: StaffRole }) {
  const [data, setData] = useState<FollowupsData>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Campaign>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    api<FollowupsData>('/followups')
      .then(setData)
      .catch((cause) => setError(cause.message));
  }, [revision]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      await api('/settings', {
        method: 'POST',
        body: JSON.stringify({ type: 'campaign', value: draft }),
      });
      setRevision((value) => value + 1);
      setDraft(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-7"
        title="후속 이벤트"
        description="캠페인별 혜택 금액과 운영 여부를 관리합니다."
        actions={
          role === 'admin' && (
            <Button onClick={() => setDraft({ id: '', name: '', amount: 0, active: 1 })}>
              + 이벤트 추가
            </Button>
          )
        }
      />
      {error && (
        <Notice tone="error">
          {error}
          <Button size="sm" variant="ghost" onClick={() => setRevision((value) => value + 1)}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {!data ? (
        !error && <Loading />
      ) : (
        <>
          <div className={styles.cards}>
            {data.campaigns.map((campaign) => (
              <Panel className={styles.campaignCard} key={campaign.id}>
                <div className={styles.cardHeading}>
                  <h2>{campaign.name}</h2>
                  <Badge tone={campaign.active ? 'blue' : 'neutral'}>
                    {campaign.active ? '활성' : '비활성'}
                  </Badge>
                </div>
                <InfoRow label="혜택 금액" value={money(campaign.amount)} />
                <InfoRow label="확인" value="직원 수동 처리" />
                <div className={styles.cardHeading}>
                  <span className={styles.muted}>실제 등록된 이벤트</span>
                  {role === 'admin' && (
                    <Button size="sm" variant="ghost" onClick={() => setDraft(campaign)}>
                      편집
                    </Button>
                  )}
                </div>
              </Panel>
            ))}
          </div>
        </>
      )}
      <Dialog
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) setDraft(undefined);
        }}
        title="후속 이벤트 편집"
        actions={
          <Button loading={busy} disabled={!draft?.id.trim() || !draft.name.trim()} onClick={save}>
            이벤트 저장
          </Button>
        }
      >
        {draft && (
          <div className={styles.form}>
            <TextField
              label="이벤트 ID"
              value={draft.id}
              onValueChange={(id) => setDraft({ ...draft, id })}
            />
            <TextField
              label="이벤트 이름"
              value={draft.name}
              onValueChange={(name) => setDraft({ ...draft, name })}
            />
            <TextField
              label="혜택 금액"
              type="number"
              min={0}
              value={String(draft.amount)}
              onValueChange={(value) => setDraft({ ...draft, amount: Number(value) })}
            />
            <label>
              <input
                type="checkbox"
                checked={Boolean(draft.active)}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked ? 1 : 0 })}
              />{' '}
              이벤트 활성
            </label>
          </div>
        )}
      </Dialog>
    </div>
  );
}
