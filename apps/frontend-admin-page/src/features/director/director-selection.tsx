// 담당 디렉터가 공개 후보를 의상별로 고르고 추가 보정 금액 확인 후 최종 셀렉을 제출합니다.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ShootDetail } from '@manspick/contracts';
import { Button, EmptyState, Notice, PhotoTile } from '@manspick/design-system/components';
import { Dialog, InfoRow, SectionHeader } from '@manspick/design-system/patterns';
import { money } from '@manspick/web/format';
import type { PerformAction } from '../shoot-detail/use-shoot-detail';
import {
  directorSelectionAction,
  directorSelectionState,
  toggleSelection,
} from './selection-model';
import styles from './selection.module.css';

export function DirectorSelection({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [draft, setDraft] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { candidates, submission, editable } = directorSelectionState(shoot);
  const selected = submission
    ? submission.photoIds
    : draft.filter((id) => candidates.some((photo) => photo.id === id));
  const locked = busy || !editable;
  const action = directorSelectionAction(shoot, selected);
  const included = shoot.package.retouchCount;
  const extraCount = Math.max(0, selected.length - included);
  const selectionLimit = shoot.extraRetouchAvailable ? 100 : included;
  const groups = [
    ...new Map(
      candidates.map((photo) => [
        photo.outfitNo === null ? 'unclassified' : String(photo.outfitNo),
        photo.outfitNo === null ? '미분류' : photo.outfitLabel || `의상 ${photo.outfitNo}`,
      ]),
    ).entries(),
  ];
  const visible = candidates.filter(
    (photo) =>
      filter === 'all' ||
      (photo.outfitNo === null ? 'unclassified' : String(photo.outfitNo)) === filter,
  );
  const pendingAmount = shoot.payments
    .filter((payment) => payment.kind === 'selection_extra' && payment.state === 'pending')
    .reduce((amount, payment) => amount + payment.amount, 0);

  async function submit() {
    if (busy || !action) return;

    if (await perform(action)) setConfirmOpen(false);
  }

  if (shoot.selectionMode !== 'director' || !shoot.capabilities.includes('submit_selection'))
    return null;

  return (
    <section className={styles.workspace}>
      <SectionHeader
        heading="h2"
        eyebrow="DIRECTOR SELECTION"
        title={submission ? '제출한 최종 셀렉' : '디렉터 최종 셀렉'}
        description={`고객에게 공개한 후보에서 보정할 컷을 골라주세요. 기본 보정 ${included}장, 초과분은 장당 ${money(shoot.retouchUnitPrice)}입니다.`}
      />
      {submission ? (
        <Notice tone="success">
          최종 {submission.photoIds.length}장을 저장했습니다. 제출 후에는 변경할 수 없습니다.
        </Notice>
      ) : !editable ? (
        <Notice>
          촬영 완료 후 후보를 공개해 셀렉을 열어주세요. 현재 상태에서는 선택을 제출할 수 없습니다.
        </Notice>
      ) : (
        <Notice>
          현장에서 디렉터 셀렉으로 확정했습니다. 고객 화면에서는 직접 선택할 수 없습니다.
        </Notice>
      )}
      {pendingAmount > 0 && (
        <Notice tone="warning">
          추가 보정 {money(pendingAmount)} 입금 확인 대기입니다. 직원이 입금을 확인한 뒤 보정이
          시작됩니다.
        </Notice>
      )}
      {!shoot.retoucherId && !submission && (
        <Notice tone="warning">
          운영자에게 보정가 배정을 요청해주세요. 배정 후 최종 셀렉을 제출할 수 있습니다.
        </Notice>
      )}
      {!shoot.extraRetouchAvailable && !submission && (
        <Notice tone="warning">
          현재 추가 보정의 신규 신청을 받지 않습니다. 기본 {included}장 안에서 선택해주세요. 기존
          신청 금액은 유지됩니다.
        </Notice>
      )}
      {candidates.length ? (
        <>
          <div className={styles.filters} aria-label="공개 후보 의상 필터">
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'secondary'}
              aria-pressed={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              전체 {candidates.length}
            </Button>
            {groups.map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={filter === id ? 'primary' : 'secondary'}
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
              >
                {label} ·{' '}
                {
                  candidates.filter(
                    (photo) =>
                      (photo.outfitNo === null ? 'unclassified' : String(photo.outfitNo)) === id,
                  ).length
                }
              </Button>
            ))}
          </div>
          <div className={styles.photos}>
            {visible.map((photo) => (
              <PhotoTile
                key={photo.id}
                label={`공개 후보 ${photo.cutNo}번 · ${photo.outfitLabel || (photo.outfitNo === null ? '의상 미분류' : `의상 ${photo.outfitNo}`)}`}
                selected={selected.includes(photo.id)}
                selectionOrder={selected.indexOf(photo.id) + 1}
                disabled={
                  locked || (!selected.includes(photo.id) && selected.length >= selectionLimit)
                }
                onSelectedChange={
                  editable
                    ? () =>
                        setDraft((previous) => toggleSelection(previous, photo.id, selectionLimit))
                    : undefined
                }
                image={<Image src={photo.url} alt="" width={220} height={280} unoptimized />}
                footer={`${photo.cutNo}번 · ${photo.outfitLabel || (photo.outfitNo === null ? '미분류' : `의상 ${photo.outfitNo}`)}`}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="공개된 후보 사진이 없습니다"
          description="후보 사진을 업로드하고 셀렉을 열면 이곳에서 선택할 수 있습니다."
        />
      )}
      {!submission && (
        <div className={styles.footer}>
          <div className={styles.count} aria-live="polite">
            <span>
              <strong>{selected.length}</strong> / 기본 {included}장
            </span>
            <span>
              {extraCount
                ? `추가 ${extraCount}장 · ${money(extraCount * shoot.retouchUnitPrice)}`
                : '추가 금액 없음'}
            </span>
          </div>
          <progress
            className={styles.progress}
            aria-label="기본 보정 수량 선택"
            max={Math.max(1, included)}
            value={Math.min(selected.length, included)}
          />
          <Button
            fullWidth
            disabled={busy || !action}
            loading={busy}
            onClick={() => setConfirmOpen(true)}
          >
            최종 {selected.length}장 셀렉 제출
          </Button>
          <p>1~{selectionLimit}장 선택 가능 · 제출 후 변경할 수 없습니다.</p>
        </div>
      )}
      <Dialog
        open={confirmOpen && editable}
        onOpenChange={setConfirmOpen}
        title={extraCount ? '추가 보정 금액을 확인해주세요' : '최종 셀렉을 제출할까요?'}
        actions={
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirmOpen(false)}>
              다시 고르기
            </Button>
            <Button disabled={busy || !action} loading={busy} onClick={submit}>
              확인하고 최종 제출
            </Button>
          </>
        }
      >
        <InfoRow label="최종 선택" value={`${selected.length}장`} />
        <InfoRow label="기본 보정" value={`${included}장 포함`} />
        <InfoRow label="추가 보정" value={`${extraCount}장 × ${money(shoot.retouchUnitPrice)}`} />
        <InfoRow label="추가 금액" value={money(extraCount * shoot.retouchUnitPrice)} />
        <Notice tone={extraCount ? 'warning' : 'info'}>
          {extraCount
            ? '고객과 추가 금액을 확인해주세요. 제출하면 추가 보정 입금 대기가 생성되며, 직원이 실제 입금을 확인한 뒤 보정이 시작됩니다.'
            : '제출하면 보정 작업이 배정됩니다. 최종 선택은 제출 후 변경할 수 없습니다.'}
        </Notice>
      </Dialog>
    </section>
  );
}
