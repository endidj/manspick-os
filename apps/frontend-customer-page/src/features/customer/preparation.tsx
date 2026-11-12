// 준비 안내 열람·의상 업로드·공유 설계·당일 진행을 실제 촬영 데이터로 보여줍니다.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, CheckItem, Notice } from '@manspick/design-system/components';
import { Dialog, InfoRow } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { SceneFooter, KakaoButton } from '../shell';
import type { CustomerViewProps } from './view-types';
import { UploadButton, UploadList } from './uploads';
import { daysUntil } from './journey';
import { packageName, shootDate, shootTime } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

const pendingGuides = [
  { id: 'confirmation', title: '촬영일 확정 안내' },
  { id: 'plan', title: '촬영 설계' },
  { id: 'packing', title: '준비물' },
  { id: 'outfits', title: '의상 준비 · 사진 올리기' },
  { id: 'addons', title: '부가서비스 안내' },
  { id: 'curriculum', title: '선택 서비스 커리큘럼' },
  { id: 'location', title: '촬영 장소' },
  { id: 'grooming', title: '그루밍 가이드' },
  { id: 'cancellation', title: '변경 · 취소 규정' },
].map((guide) => ({ ...guide, summary: '담당자가 안내를 준비하고 있어요', readAt: null }));

export function PreparationView({
  shoot,
  busy,
  onUpload,
  onAction,
  onNavigate,
  onHelp,
}: CustomerViewProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const preparation = shoot.preparation;
  const guides = preparation?.guides ?? [];
  const visibleGuides = guides.length ? guides : pendingGuides;
  const selected = guides.find((guide) => guide.id === openId);
  const read = guides.filter((guide) => guide.readAt).length;
  const days = daysUntil(shoot.startsAt);
  const outfitGuide =
    selected && (selected.id.includes('outfit') || guides.indexOf(selected) === 3);

  async function openGuide(id: string, index: number) {
    const guide = guides.find((item) => item.id === id);
    if (!guide) return;
    if (index === 1 && shoot.plan?.sharedAt) {
      if (!guide.readAt) await onAction({ type: 'mark_preparation_read', guideId: id });
      onNavigate('plan');
      return;
    }
    setOpenId(id);
    if (!guide.readAt) await onAction({ type: 'mark_preparation_read', guideId: id });
  }

  return (
    <>
      <section className={styles.dayCard}>
        <div className={layout.between}>
          <strong className={styles.dayTitle}>
            {days === 0 ? 'D-DAY' : days !== null && days > 0 ? `D−${days}` : '촬영 준비'}
          </strong>
          <span className={styles.greenPill}>촬영 확정</span>
        </div>
        <h1>{shootDate(shoot.startsAt, true)}</h1>
        <p>
          <Icon name="solar/map-point-bold" size={17} />
          {preparation?.location.area || '촬영 장소는 정해지면 바로 안내'}
          {preparation?.location.meetingPlace && ` · ${preparation.location.meetingPlace}`}
          {preparation?.location.mapUrl && (
            <>
              {' '}
              ·{' '}
              <a href={preparation.location.mapUrl} target="_blank" rel="noreferrer">
                지도 보기
              </a>
            </>
          )}
        </p>
        <p>
          <Icon name="solar/user-bold" size={17} />
          {shoot.directorName ?? '담당 확인 중'} 디렉터
        </p>
        <p>
          <Icon name="clock" size={17} />약 {shoot.package.duration / 60}시간 ·{' '}
          {packageName(shoot.packageId, shoot.package.name)} ({shoot.package.outfits}벌)
        </p>
      </section>
      <section className={layout.stack}>
        <div className={layout.between}>
          <h2 className={styles.sectionTitle}>촬영 전 확인할 안내</h2>
          <span className={styles.cyan}>
            {read} / {guides.length || 9} 확인
          </span>
        </div>
        <div className={styles.progressTrack}>
          <span style={{ width: `${guides.length ? (read / guides.length) * 100 : 0}%` }} />
        </div>
        <div className={styles.guideList}>
          {visibleGuides.map((guide, index) => (
            <CheckItem
              className={styles.guideItem}
              key={guide.id}
              label={guide.title}
              description={guide.summary}
              completed={Boolean(guide.readAt)}
              disabled={busy || !preparation}
              onClick={() => void openGuide(guide.id, index)}
            />
          ))}
        </div>
        {!guides.length && (
          <Notice>촬영 준비 안내를 정리하고 있어요. 담당자에게 준비 일정을 확인해주세요.</Notice>
        )}
      </section>
      <Notice tone="warning">
        <strong>⚠ 촬영 전날엔 이것만 피해주세요</strong>
        <div className={styles.warningTags}>
          {['음주', '과식', '무리한 운동', '수면 부족'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <p>푹 자고 오시는 게 제일 좋은 준비예요. 나머지는 현장에서 저희가 편하게 이끌어드릴게요.</p>
      </Notice>
      <SceneFooter>
        <Button
          fullWidth
          loading={busy}
          disabled={
            busy || !guides.length || read !== guides.length || Boolean(preparation?.confirmedAt)
          }
          onClick={() => onAction({ type: 'confirm_preparation' })}
        >
          {preparation?.confirmedAt ? '촬영 준비 확인 완료' : '안내를 모두 확인했어요'}
        </Button>
        <KakaoButton onClick={onHelp}>궁금한 점은 카카오톡으로</KakaoButton>
      </SceneFooter>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setOpenId(null)}
        title={selected?.title ?? '촬영 안내'}
        actions={<Button onClick={() => setOpenId(null)}>확인</Button>}
      >
        {selected && (
          <div className={layout.stack}>
            <p className={layout.preWrap}>
              {selected.body || '담당자가 안내 내용을 준비하고 있어요.'}
            </p>
            {selected.url && (
              <a className={layout.textLink} href={selected.url} target="_blank" rel="noreferrer">
                안내 자세히 보기 ↗
              </a>
            )}
            {outfitGuide && (
              <>
                <p>
                  필요한 의상 {shoot.outfitPhotosRequired}벌 ·{' '}
                  {shoot.uploads.filter((item) => item.kind === 'outfit').length}장 업로드
                </p>
                <p className={layout.small}>
                  {shoot.outfitDueAt
                    ? `${shootDate(shoot.outfitDueAt)}까지 올려주세요.`
                    : '업로드 기한은 담당자에게 확인해주세요.'}
                </p>
                <UploadButton
                  busy={busy}
                  label="의상 사진 올리기"
                  onFile={(file) => onUpload(file, 'outfit')}
                />
                <UploadList items={shoot.uploads.filter((item) => item.kind === 'outfit')} />
              </>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}

export function PlanView({ shoot, onNavigate, onHelp }: CustomerViewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const plan = shoot.plan;
  if (!plan?.sharedAt)
    return (
      <>
        <Notice>디렉터가 촬영을 설계하고 있어요. 공유되면 이곳에서 확인할 수 있어요.</Notice>
        <Button onClick={() => onNavigate('preparation')}>준비 안내로 돌아가기</Button>
      </>
    );
  return (
    <>
      <header className={styles.completionHeader}>
        <span className={styles.successMark}>
          <Icon name="solar/check-circle-bold" size={32} />
        </span>
        <h1>디렉터가 촬영을 설계했어요</h1>
        <p>
          {shoot.directorName ?? '담당'} 디렉터 · {shootDate(plan.sharedAt)}
          <br />
          설문을 보고 {shoot.customerName}님께 맞춰 준비했어요.
        </p>
      </header>
      <section className={layout.card}>
        <p className={styles.iconText}>
          <Icon name="solar/check-circle-bold" size={17} />
          컨셉 · {plan.concept}
        </p>
        {plan.outfits
          .split('\n')
          .filter(Boolean)
          .map((outfit, index) => (
            <p className={styles.iconText} key={`${index}-${outfit}`}>
              <Icon name="solar/magic-stick-3-bold" size={17} />
              {outfit}
            </p>
          ))}
        {plan.referenceImages?.length > 0 && (
          <div className={layout.photoGrid}>
            {plan.referenceImages.map((asset) => (
              <button
                className={styles.imageButton}
                key={asset.id}
                onClick={() => setImageUrl(asset.url)}
                aria-label={`${asset.name} 참고 사진 확대`}
              >
                <Image unoptimized src={asset.url} alt={asset.name} width={300} height={400} />
              </button>
            ))}
          </div>
        )}
      </section>
      <section className={layout.card}>
        <p className={layout.small}>촬영 장소 · 시간</p>
        <InfoRow label="동네" value={shoot.preparation?.location.area || '정해지면 바로 안내'} />
        <InfoRow
          label="만남"
          value={shoot.preparation?.location.meetingPlace || '정해지면 바로 안내'}
        />
        {shoot.preparation?.hair && (
          <InfoRow
            label="헤어"
            value={`${shoot.preparation.hair.time} ${shoot.preparation.hair.place}`}
          />
        )}
        <InfoRow label="촬영" value={shootDate(shoot.startsAt, true)} />
        {plan.note && <p className={layout.small}>디렉터 메모: {plan.note}</p>}
      </section>
      <SceneFooter>
        <Button variant="secondary" fullWidth onClick={() => onNavigate('preparation')}>
          의상 사진 올리기
        </Button>
        <KakaoButton onClick={onHelp}>디렉터에게 카톡으로 문의</KakaoButton>
      </SceneFooter>
      <Dialog
        open={Boolean(imageUrl)}
        onOpenChange={(open) => !open && setImageUrl(null)}
        title="촬영 참고 사진"
      >
        {imageUrl && (
          <Image
            className={styles.enlargedPhoto}
            unoptimized
            src={imageUrl}
            alt="촬영 설계 참고 사진"
            width={720}
            height={960}
          />
        )}
      </Dialog>
    </>
  );
}

const daySteps = [
  { status: 'arrived', label: '만남 장소 도착' },
  { status: 'addons_in_progress', label: '헤어 & 메이크업' },
  { status: 'outfit_checked', label: '진행 순서 안내 · 의상 점검' },
  { status: 'shooting', label: '촬영' },
  { status: 'mid_check', label: '중간 확인' },
  { status: 'shoot_complete', label: '마무리 안내' },
];

export function ShootDayView({ shoot, onHelp }: CustomerViewProps) {
  const [parkingOpen, setParkingOpen] = useState(false);
  const current = daySteps.findIndex((step) => step.status === shoot.status);
  const location = shoot.preparation?.location;
  const hasHair =
    shoot.addons.some((addon) => addon.id === 'hair' && addon.quantity > 0) ||
    Boolean(shoot.preparation?.hair);
  return (
    <>
      <section className={styles.dayCard}>
        <div className={layout.between}>
          <strong className={styles.dayTitle}>D-DAY</strong>
          <span className={styles.redPill}>
            ● {current >= 0 && current < 5 ? '촬영 중' : current === 5 ? '촬영 완료' : '촬영 대기'}
          </span>
        </div>
        <h2>
          오늘 {shootTime(shoot.startsAt)} · {shoot.directorName ?? '담당'} 디렉터와{' '}
          {current >= 0 && current < 5
            ? '촬영 중이에요'
            : current === 5
              ? '촬영을 마쳤어요'
              : '만나요'}
        </h2>
        <p>디렉터가 단계를 체크하면 여기에도 바로 표시돼요.</p>
      </section>
      <ol className={styles.dayTimeline}>
        {daySteps
          .filter((step) => hasHair || step.status !== 'addons_in_progress')
          .map((step) => {
            const index = daySteps.indexOf(step);
            const event = shoot.timeline.find((item) => item.to === step.status);
            const completed = current > index;
            return (
              <li
                key={step.status}
                data-completed={completed || undefined}
                data-current={current === index || undefined}
              >
                <span className={styles.dayDot}>
                  {completed ? <Icon name="check" size={15} /> : current === index ? '●' : ''}
                </span>
                <strong>{step.label}</strong>
                <p>
                  {event
                    ? shootTime(event.createdAt)
                    : current === index
                      ? '진행 중'
                      : step.status === 'mid_check'
                        ? '찍힌 컷을 함께 보고 방향을 맞춰요'
                        : step.status === 'shoot_complete'
                          ? '셀렉·보정 일정 안내'
                          : step.status === 'addons_in_progress'
                            ? '촬영 전에 제휴샵에서 먼저 · 디렉터 미동행'
                            : '진행 예정'}
                </p>
              </li>
            );
          })}
      </ol>
      <section className={layout.card}>
        <strong className={styles.iconText}>
          <Icon name="solar/map-point-bold" size={17} />
          {location?.meetingPlace || '만남 장소 확인 중'} (오늘 만날 장소)
        </strong>
        {shoot.preparation?.hair && (
          <p className={layout.small}>헤어 & 메이크업: {shoot.preparation.hair.place}</p>
        )}
        <div className={styles.mapPlaceholder}>
          <Icon name="solar/map-point-bold" size={30} />
          <span>{location?.area || '장소가 정해지면 바로 안내해요'}</span>
        </div>
        <div className={layout.actions}>
          {location?.mapUrl ? (
            <a
              className={styles.secondaryLink}
              href={location.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              길찾기 ↗
            </a>
          ) : (
            <Button variant="secondary" onClick={onHelp}>
              장소 문의
            </Button>
          )}
          <Button variant="secondary" onClick={() => setParkingOpen(true)}>
            주차 안내
          </Button>
        </div>
      </section>
      <SceneFooter>
        <KakaoButton onClick={onHelp}>늦거나 문제가 생기면 카톡으로 연락</KakaoButton>
      </SceneFooter>
      <Dialog open={parkingOpen} onOpenChange={setParkingOpen} title="주차 안내">
        <p>
          {location?.parkingNote ||
            '주차 안내가 아직 등록되지 않았어요. 담당 디렉터에게 문의해주세요.'}
        </p>
        {location?.parkingUrl && (
          <a
            className={layout.textLink}
            href={location.parkingUrl}
            target="_blank"
            rel="noreferrer"
          >
            주차 위치 보기 ↗
          </a>
        )}
      </Dialog>
    </>
  );
}
