// 사진의 의상별 선택·초과 결제·추가 보정·수정 요청을 실제 서버 계약에 연결합니다.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Badge, Button, Notice, EmptyState, PhotoTile } from '@manspick/design-system/components';
import { Dialog, TextArea, TextField, InfoRow } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { money } from '@manspick/web/format';
import type { PaymentDTO } from '@manspick/contracts';
import { SceneFooter } from '../shell';
import type { CustomerViewProps } from './view-types';
import { resolveJourney } from './journey';
import { UploadList } from './uploads';
import { packageName, shootDate } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

export function PhotoWorkspace({
  shoot,
  busy,
  onAction,
  onNavigate,
  scene,
}: CustomerViewProps & { scene: 'selection' | 'results' | 'revision' | 'extra-retouch' }) {
  const extra = scene === 'extra-retouch';
  const [selected, setSelected] = useState<string[]>(() =>
    extra ? [] : (shoot.selections.find((selection) => selection.round === 'base')?.photoIds ?? []),
  );
  const [filter, setFilter] = useState('all');
  const [comments, setComments] = useState<Record<string, string>>({});
  const [revisionPhotos, setRevisionPhotos] = useState<string[]>([]);
  const [openFiles, setOpenFiles] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const basePicks =
    shoot.selections.find((selection) => selection.round === 'base')?.photoIds ?? [];
  const candidates = shoot.photos.filter(
    (photo) => photo.kind === 'candidate' && (!extra || !basePicks.includes(photo.id)),
  );
  const results = shoot.photos.filter(
    (photo) => photo.kind === 'retouched' || photo.kind === 'revision',
  );
  const required = extra ? 0 : shoot.package.retouchCount;
  const extraQuantity = Math.max(0, selected.length - required);
  const selectionLimit = shoot.extraRetouchAvailable ? 100 : required;
  const directorSelecting = !extra && resolveJourney(shoot).state === 'director-selection';
  const submitted = shoot.selections.some(
    (selection) => selection.round === (extra ? 'extra' : 'base'),
  );
  const pendingRevision = shoot.requests.some(
    (request) => request.type === 'revision' && ['new', 'processing'].includes(request.state),
  );
  const locked =
    busy ||
    directorSelecting ||
    submitted ||
    (extra && !shoot.extraRetouchAvailable) ||
    (!extra && shoot.status !== 'selection_pending');
  const retouchedLink = shoot.fileLinks.find((link) => link.kind === 'retouched');
  const originalLink = shoot.fileLinks.find((link) => link.kind === 'original');
  const remaining = Math.max(0, 3 - shoot.revisionCount);
  const pendingPayments = shoot.payments.filter(
    (payment) =>
      ['selection_extra', 'extra_retouch'].includes(payment.kind) && payment.state === 'pending',
  );
  const groups = [
    ...new Map(
      candidates
        .filter((photo) => photo.outfitNo !== null)
        .map((photo) => [String(photo.outfitNo), photo.outfitLabel || `의상 ${photo.outfitNo}`]),
    ).entries(),
  ];
  const visibleCandidates = candidates.filter(
    (photo) => filter === 'all' || String(photo.outfitNo) === filter,
  );

  function toggle(id: string) {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : previous.length < selectionLimit
          ? [...previous, id]
          : previous,
    );
  }

  async function submitSelection() {
    if (!shoot.extraRetouchAvailable && extraQuantity > 0) return;
    if (
      await onAction({
        type: extra ? 'request_extra_retouch' : 'submit_selection',
        photoIds: selected,
      })
    ) {
      setConfirmOpen(false);
      onNavigate('results');
    }
  }

  async function sendRevision() {
    const items = revisionPhotos
      .filter((id) => comments[id]?.trim())
      .map((photoId) => ({ photoId, comment: comments[photoId].trim() }));
    if (await onAction({ type: 'request_revision', items })) {
      setComments({});
      setRevisionPhotos([]);
      onNavigate('results');
    }
  }

  if (scene === 'revision')
    return (
      <>
        <header className={layout.stack}>
          <p className={layout.overline}>STEP 6</p>
          <h1>고칠 사진을 골라주세요</h1>
          <p>
            사진마다 어떻게 고치면 좋을지 적어주세요.
            <br />
            여러 장을 보내도 1회로 세요. (남은 수정 {remaining}회)
          </p>
        </header>
        <div className={layout.photoGrid}>
          {results.map((photo) => (
            <PhotoTile
              key={photo.id}
              className={styles.compactPhoto}
              label={`사진 ${photo.cutNo}`}
              selected={revisionPhotos.includes(photo.id)}
              disabled={busy || remaining === 0 || pendingRevision}
              onSelectedChange={() =>
                setRevisionPhotos((previous) =>
                  previous.includes(photo.id)
                    ? previous.filter((id) => id !== photo.id)
                    : [...previous, photo.id],
                )
              }
              image={<Image unoptimized width={600} height={800} src={photo.url} alt="" />}
            />
          ))}
        </div>
        {revisionPhotos.map((id) => {
          const photo = results.find((item) => item.id === id)!;
          return (
            <section className={layout.card} key={id}>
              <div className={styles.revisionHeading}>
                <Image unoptimized width={48} height={64} src={photo.url} alt="" />
                <span>사진 {photo.cutNo} · 어떻게 고칠까요?</span>
              </div>
              <TextArea
                label={`사진 ${photo.cutNo} 수정 의견`}
                className={styles.revisionInput}
                value={comments[id] ?? ''}
                onValueChange={(value) => setComments((previous) => ({ ...previous, [id]: value }))}
                maxLength={1000}
                placeholder="원하는 수정 내용을 알려주세요"
              />
            </section>
          );
        })}
        <Notice>
          수정본이 완성되면 이곳에서 확인할 수 있어요. 여러 사진의 의견을 함께 보내도 1회로
          집계돼요.
        </Notice>
        <SceneFooter>
          <Button
            fullWidth
            loading={busy}
            disabled={
              busy ||
              remaining === 0 ||
              pendingRevision ||
              !revisionPhotos.length ||
              revisionPhotos.some((id) => !comments[id]?.trim())
            }
            onClick={sendRevision}
          >
            수정 요청 보내기 · 1회 사용
          </Button>
          <Button variant="secondary" fullWidth onClick={() => onNavigate('results')}>
            취소
          </Button>
        </SceneFooter>
      </>
    );

  if (scene === 'results')
    return (
      <>
        <header className={layout.stack}>
          <p className={layout.overline}>STEP 6</p>
          <h1>
            {results.length
              ? `보정본 ${results.length}장이 도착했어요 🎉`
              : pendingPayments.length
                ? '추가 보정 입금을 확인하고 있어요'
                : '보정본을 준비하고 있어요'}
          </h1>
          <p>
            {results.length
              ? '고르신 사진을 담당 보정가가 완성했어요. 지금 바로 받아보세요.'
              : pendingPayments.length
                ? '입금 후 알려주시면 직원 확인 뒤 보정이 시작돼요.'
                : '고르신 사진은 평균 1~3일 뒤에 받아보실 수 있어요.'}
          </p>
        </header>
        {pendingPayments.map((payment) => (
          <RetouchPayment
            key={payment.id}
            payment={payment}
            shoot={shoot}
            busy={busy}
            onAction={onAction}
          />
        ))}
        {results.length ? (
          <div className={layout.photoGrid}>
            {results.map((photo) => (
              <button
                className={styles.imageButton}
                key={photo.id}
                onClick={() => setPreview(photo.url)}
                aria-label={`보정 사진 ${photo.cutNo} 확대`}
              >
                <Image
                  unoptimized
                  width={600}
                  height={800}
                  src={photo.url}
                  alt={`${photo.cutNo}번 보정 사진`}
                />
              </button>
            ))}
          </div>
        ) : (
          !pendingPayments.length && (
            <EmptyState
              title="사진을 완성하고 있어요"
              description="보정본이 공개되면 이 화면에서 확인할 수 있어요."
            />
          )
        )}
        {results.length > 0 && (
          <>
            <section className={styles.deliveryCard}>
              <span className={styles.deliveryIcon}>
                <Icon name="solar/gallery-bold" size={21} />
              </span>
              <div>
                <strong>보정본 {results.length}장</strong>
                <p>
                  {retouchedLink
                    ? `외부 드라이브 폴더${retouchedLink.publishedAt ? ` · ${shootDate(retouchedLink.publishedAt)} 전달` : ''}`
                    : '사진별로 내려받을 수 있어요'}
                </p>
              </div>
              {retouchedLink ? (
                <a
                  className={styles.openFile}
                  href={retouchedLink.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  열기
                </a>
              ) : (
                <button className={styles.openFile} onClick={() => setOpenFiles(true)}>
                  열기
                </button>
              )}
            </section>
            <section
              className={styles.deliveryCard}
              data-locked={(!originalLink && !shoot.originals.length) || undefined}
            >
              <span className={styles.deliveryIcon}>
                <Icon name="download" size={21} />
              </span>
              <div>
                <strong>원본 전체</strong>
                <p>
                  {originalLink || shoot.originals.length
                    ? '후기 확인이 완료되어 열렸어요'
                    : '후기 작성 확인 후 열려요'}
                </p>
              </div>
              {originalLink ? (
                <a
                  className={styles.openFile}
                  href={originalLink.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  열기
                </a>
              ) : (
                <button
                  className={styles.openFile}
                  disabled={!shoot.originals.length}
                  onClick={() => onNavigate('review')}
                >
                  {shoot.originals.length ? '열기' : '잠김'}
                </button>
              )}
            </section>
            <Notice>수정은 전체 3번까지 가능해요. 고칠 사진을 골라 요청해주세요.</Notice>
          </>
        )}
        {pendingRevision && <Notice>수정 요청을 보냈어요. 담당 보정가가 확인하고 있어요.</Notice>}
        <SceneFooter>
          {results.length > 0 && (
            <Button fullWidth onClick={() => onNavigate('review')}>
              후기 쓰고 원본 받기
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth
            disabled={!results.length || busy || remaining === 0 || pendingRevision}
            onClick={() => onNavigate('revision')}
          >
            수정 요청하기 · {remaining}회 남음
          </Button>
        </SceneFooter>
        <Dialog open={openFiles} onOpenChange={setOpenFiles} title="보정본 내려받기">
          <UploadList items={results} />
        </Dialog>
        <Dialog
          open={Boolean(preview)}
          onOpenChange={(open) => !open && setPreview(null)}
          title="보정 사진"
        >
          {preview && (
            <>
              <Image
                className={styles.enlargedPhoto}
                unoptimized
                src={preview}
                width={720}
                height={960}
                alt="확대한 보정 사진"
              />
              <a className={styles.textAction} href={preview} target="_blank" rel="noreferrer">
                사진 내려받기 ↗
              </a>
            </>
          )}
        </Dialog>
      </>
    );

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP {extra ? 7 : 6}</p>
        <h1>
          {extra
            ? '추가로 보정할 사진을 골라주세요'
            : directorSelecting
              ? '디렉터가 사진을 고르는 중이에요'
              : `보정할 사진 ${required}장을 골라주세요`}
        </h1>
        <p>
          디렉터가 먼저 고른 후보 {candidates.length}장이에요.
          <br />
          {directorSelecting
            ? '지금은 후보 사진을 둘러보실 수 있어요.'
            : extra
              ? `이미 보정한 사진은 제외했어요. 1장당 ${money(shoot.retouchUnitPrice)}이에요.`
              : '마음에 드는 사진을 고르면 보정을 시작해요.'}
        </p>
      </header>
      <div className={layout.row}>
        <Badge tone="blue">
          {packageName(shoot.packageId, shoot.package.name)} ·{' '}
          {extra ? '추가 보정' : `보정 ${required}장`}
        </Badge>
        <Badge>전달까지 평균 1~3일</Badge>
      </div>
      {directorSelecting && (
        <Notice>
          디렉터에게 맡긴 셀렉이에요. 현장에서 직접 고르기로 바꾸셨다면 담당자에게 알려주세요.
        </Notice>
      )}
      {!shoot.extraRetouchAvailable && (
        <Notice>
          현재 추가 보정의 신규 신청을 받지 않아요. 기본 보정 {shoot.package.retouchCount}장 안에서
          선택해주세요. 이미 접수한 신청은 그대로 진행돼요.
        </Notice>
      )}
      {candidates.length ? (
        <>
          <div className={styles.photoFilters}>
            <button
              className={styles.photoFilter}
              data-active={filter === 'all' || undefined}
              onClick={() => setFilter('all')}
            >
              전체 {candidates.length}
            </button>
            {groups.map(([id, label]) => (
              <button
                key={id}
                className={styles.photoFilter}
                data-active={filter === id || undefined}
                onClick={() => setFilter(id)}
              >
                {label} {candidates.filter((photo) => String(photo.outfitNo) === id).length}
              </button>
            ))}
          </div>
          <div className={layout.photoGrid}>
            {visibleCandidates.map((photo) => (
              <PhotoTile
                className={styles.compactPhoto}
                key={photo.id}
                label={`촬영 후보 ${photo.cutNo}번`}
                selected={selected.includes(photo.id)}
                selectionOrder={selected.indexOf(photo.id) + 1}
                disabled={
                  locked || (!selected.includes(photo.id) && selected.length >= selectionLimit)
                }
                onSelectedChange={directorSelecting ? undefined : () => toggle(photo.id)}
                image={<Image unoptimized width={600} height={800} src={photo.url} alt="" />}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="선택할 후보 사진이 없어요"
          description="후보 사진이 공개되거나 추가 후보가 생기면 이곳에서 확인할 수 있어요."
        />
      )}
      {submitted && (
        <Notice tone="success">
          사진 선택을 제출했어요. 보정 진행은 결과물 화면에서 확인해주세요.
        </Notice>
      )}
      {!directorSelecting && (
        <SceneFooter>
          <div className={layout.between}>
            <span>
              <strong className={styles.selectedCount}>{selected.length}</strong>
              {extra ? '장 선택' : ` / ${required}장 선택`}
            </span>
            <span>
              {extraQuantity
                ? `추가 ${extraQuantity}장 · ${money(extraQuantity * shoot.retouchUnitPrice)}`
                : `${Math.max(0, required - selected.length)}장 더 고를 수 있어요`}
            </span>
          </div>
          {!extra && (
            <div className={styles.selectionProgress}>
              {Array.from({ length: required }, (_, index) => (
                <span key={index} data-active={index < selected.length || undefined} />
              ))}
            </div>
          )}
          <Button
            fullWidth
            disabled={
              locked || !selected.length || (!shoot.extraRetouchAvailable && extraQuantity > 0)
            }
            loading={busy}
            onClick={() => (extraQuantity ? setConfirmOpen(true) : void submitSelection())}
          >
            {extra ? '추가 보정 신청하기' : '선택 완료하고 보정 요청'}
          </Button>
          <p>
            {extraQuantity
              ? '추가 금액 입금을 직원이 확인한 후 보정을 시작해요.'
              : '선택 완료 후에는 바꿀 수 없어요. 천천히 골라주세요.'}
          </p>
        </SceneFooter>
      )}
      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="추가 보정 금액을 확인해주세요"
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              다시 고르기
            </Button>
            <Button loading={busy} disabled={busy} onClick={submitSelection}>
              확인하고 신청
            </Button>
          </>
        }
      >
        <div className={layout.stack}>
          <InfoRow label="선택한 사진" value={`${selected.length}장`} />
          <InfoRow
            label={extra ? '추가 보정' : '기본 수량 초과'}
            value={`${extraQuantity}장 × ${money(shoot.retouchUnitPrice)}`}
          />
          <InfoRow label="입금할 추가 금액" value={money(extraQuantity * shoot.retouchUnitPrice)} />
          <Notice>
            신청 후 입금 안내를 보여드려요. 실제 입금을 직원이 확인한 뒤 보정이 시작돼요.
          </Notice>
        </div>
      </Dialog>
    </>
  );
}

function RetouchPayment({
  payment,
  shoot,
  busy,
  onAction,
}: Pick<CustomerViewProps, 'shoot' | 'busy' | 'onAction'> & { payment: PaymentDTO }) {
  const [depositor, setDepositor] = useState(shoot.customerName);
  const [copied, setCopied] = useState('');
  const requested = shoot.requests.some(
    (request) =>
      request.type === 'deposit' &&
      ['new', 'processing'].includes(request.state) &&
      request.message?.includes(payment.id),
  );
  const account = shoot.paymentInstructions;

  async function copyAccount() {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(`${account.bankName} ${account.accountNumber}`);
      setCopied('계좌를 복사했어요.');
    } catch {
      setCopied('복사하지 못했어요. 계좌를 직접 선택해 복사해주세요.');
    }
  }

  return (
    <section className={layout.card}>
      <h2>추가 보정 입금 안내</h2>
      <InfoRow label="추가 금액" value={money(payment.amount)} />
      {account ? (
        <>
          <p>
            {account.bankName} {account.accountNumber}
            <br />
            예금주 {account.accountHolder}
          </p>
          <button className={styles.textAction} onClick={copyAccount}>
            계좌 복사
          </button>
        </>
      ) : (
        <Notice>등록된 계좌가 없어 상담 채널에서 입금 계좌를 확인해주세요.</Notice>
      )}
      {copied && (
        <p className={layout.small} role="status">
          {copied}
        </p>
      )}
      <TextField label="입금자명" value={depositor} onValueChange={setDepositor} maxLength={40} />
      <Button
        fullWidth
        disabled={busy || requested || !depositor.trim()}
        loading={busy}
        onClick={() =>
          onAction({ type: 'request_deposit', depositor: depositor.trim(), paymentId: payment.id })
        }
      >
        {requested ? '입금 확인 요청 완료' : '입금했어요'}
      </Button>
    </section>
  );
}
