// 실제 후속 혜택과 고객 요청을 조회하고 직원의 확인·반려를 저장합니다.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import {
  Badge,
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
} from '@manspick/design-system/components';
import { Dialog, InfoRow, TextField } from '@manspick/design-system/patterns';
import type { OperationsSettingsDTO, RequestDTO } from '@manspick/contracts';
import { action, api } from '@manspick/web/client';
import { dateTime, money } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import { shootHref } from '../workspace/model';
import styles from './management.module.css';

type Campaign = OperationsSettingsDTO['campaigns'][number];
type FollowupsData = {
  campaigns: Campaign[];
  items: { shootId: string; customerName: string; request: RequestDTO }[];
};

export function Followups({ role }: { role: StaffRole }) {
  const [data, setData] = useState<FollowupsData>();
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Campaign>();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    api<FollowupsData>('/followups')
      .then(setData)
      .catch((cause) => setError(cause.message));
  }, [revision]);

  async function resolve(shootId: string, requestId: string, decision: 'complete' | 'reject') {
    setBusy(true);
    setError('');
    try {
      await action(shootId, { type: 'resolve_request', requestId, decision });
      setRevision((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

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

  const items =
    data?.items.filter((item) => filter === 'all' || item.request.type === filter) ?? [];
  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-7"
        title="후속 이벤트"
        description="후기 · 원본 제공 · 추가 보정 · 재방문/지인소개 · 블로그 이벤트 — 확인과 지급은 직원 수동 처리"
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
          <div className={styles.cardHeading}>
            <h2 className={styles.sectionTitle}>확인 대기 큐</h2>
            <div className={styles.queueFilters}>
              {[
                ['all', '전체'],
                ['review', '후기'],
                ['extra_retouch', '추가 보정'],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  data-active={filter === id}
                  onClick={() => setFilter(id)}
                >
                  {label}{' '}
                  {data.items.filter((item) => id === 'all' || item.request.type === id).length}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>고객</th>
                  <th>이벤트</th>
                  <th>제출 내용</th>
                  <th>제출일</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.request.id}>
                    <th>{item.customerName}</th>
                    <td>{item.request.type === 'review' ? '후기 → 원본' : '추가 보정'}</td>
                    <td>{item.request.message || '첨부 자료는 고객 상세에서 확인'}</td>
                    <td>{dateTime(item.request.createdAt)}</td>
                    <td>
                      <Badge tone={item.request.state === 'complete' ? 'green' : 'amber'}>
                        {item.request.state === 'complete'
                          ? '확인 완료'
                          : item.request.state === 'rejected'
                            ? '반려'
                            : '확인 대기'}
                      </Badge>
                    </td>
                    <td>
                      <div className={styles.inlineActions}>
                        <Link href={shootHref(item.shootId)}>고객 상세</Link>
                        {['new', 'processing'].includes(item.request.state) && (
                          <>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => resolve(item.shootId, item.request.id, 'complete')}
                            >
                              확인
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => resolve(item.shootId, item.request.id, 'reject')}
                            >
                              반려
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && <EmptyState title="확인할 후속 요청이 없습니다" />}
          </div>
          <Notice>
            후기 링크·캡처를 직접 확인하고 처리합니다. 후기 확인 완료 후에만 전체 원본이 고객에게
            공개됩니다.
          </Notice>
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
              hint="후기 확인과 연결할 이벤트 ID는 review입니다."
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
