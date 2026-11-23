// 준비 안내 열람·의상 업로드·공유 설계·당일 진행을 실제 촬영 데이터로 보여줍니다.
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, CheckItem, Notice } from '@manspick/design-system/components';
import { Dialog, InfoRow } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { statusInfo } from '@manspick/domain';
import type { PreparationDTO } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import { SceneFooter, KakaoButton } from '../shell';
import type { CustomerViewProps } from './view-types';
import { UploadButton, UploadList } from './uploads';
import { daysUntil } from './journey';
import { packageName, shootDate, shootSchedule, shootTime } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

type Guide = PreparationDTO['guides'][number];

const pendingGuides: Guide[] = [
  { id: 'confirmation', title: '촬영일 확정 안내' },
  { id: 'plan', title: '촬영 설계' },
  { id: 'packing', title: '준비물' },
  { id: 'outfits', title: '의상 준비 · 사진 올리기' },
  { id: 'addons', title: '부가서비스 안내' },
  { id: 'curriculum', title: '선택 서비스 커리큘럼' },
  { id: 'location', title: '촬영 장소' },
  { id: 'grooming', title: '그루밍 노션' },
  { id: 'cancellation', title: '변경·취소 규정' },
].map((guide) => ({
  ...guide,
  summary: '담당자가 안내를 준비하고 있어요',
  body: '',
  readAt: null,
}));

function isOutfitGuide(guide: { id: string; title: string }) {
  return /outfit/i.test(guide.id) || /의상.*(사진|준비)|^의상$/.test(guide.title);
}

function isPlanGuide(guide: { id: string; title: string }) {
  return (
    /(?:^|[-_])(plan|design)(?:$|[-_])/i.test(guide.id) || /촬영\s*설계|^설계$/.test(guide.title)
  );
}

function directorLabel(name: string | null) {
  if (!name?.trim()) return '담당 디렉터';
  return name.trim().endsWith('디렉터') ? name.trim() : `${name.trim()} 디렉터`;
}

export function PreparationView({
  shoot,
  busy,
  onUpload,
  onAction,
  onNavigate,
  onHelp,
  outfitsOpen,
  onOutfitsOpenChange,
}: CustomerViewProps & { outfitsOpen: boolean; onOutfitsOpenChange: (open: boolean) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const preparation = shoot.preparation;
  const guides = preparation?.guides ?? [];
  const outfitGuide = guides.find(isOutfitGuide);
  const uploaded = shoot.uploads.filter((asset) => asset.kind === 'outfit');
  const outfitsReady = uploaded.length >= shoot.outfitPhotosRequired;
  const visibleGuides = guides.length
    ? [...guides]
    : pendingGuides.filter(
        (guide) => guide.id !== 'grooming' || ['hybrid', 'allday'].includes(shoot.packageId),
      );
  if (guides.length && !outfitGuide) visibleGuides.push(pendingGuides.find(isOutfitGuide)!);
  const selected = guides.find((guide) => guide.id === openId);
  const dialogGuide = outfitsOpen ? outfitGuide : selected;
  const completeGuide = (guide: Guide) =>
    isOutfitGuide(guide) ? outfitsReady : Boolean(guide.readAt);
  const read = visibleGuides.filter(completeGuide).length;
  const guidesReady = guides.every((guide) => isOutfitGuide(guide) || guide.readAt);
  const days = daysUntil(shoot.startsAt);

  function guideDescription(guide: Guide) {
    if (isOutfitGuide(guide)) {
      if (!shoot.outfitPhotosRequired) return '올려야 할 의상 사진이 없어요';
      const due = shoot.outfitDueAt ? ` · ${shootDate(shoot.outfitDueAt)}까지` : '';
      return `${shoot.outfitPhotosRequired}벌 기준 · ${uploaded.length}장 업로드${due}`;
    }
    if (isPlanGuide(guide))
      return shoot.plan?.sharedAt
        ? '디렉터 컨셉 · 벌별 코디 제안 · 장소'
        : '디렉터가 설계 중이에요';
    return guide.summary;
  }

  function openGuide(guide: Guide) {
    if (isOutfitGuide(guide)) onOutfitsOpenChange(true);
    else if (isPlanGuide(guide)) onNavigate('plan');
    else setOpenId(guide.id);
    const shared = guides.find((item) => item.id === guide.id);
    if (shared && !shared.readAt)
      void onAction({ type: 'mark_preparation_read', guideId: shared.id });
  }

  function closeGuide() {
    setOpenId(null);
    onOutfitsOpenChange(false);
  }

  async function confirmPreparation() {
    if (
      outfitGuide &&
      !outfitGuide.readAt &&
      !(await onAction({ type: 'mark_preparation_read', guideId: outfitGuide.id }))
    )
      return;
    await onAction({ type: 'confirm_preparation' });
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
        <h1>{shoot.startsAt ? dateTime(shoot.startsAt) : '일정 확인 중'}</h1>
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
          {shoot.directorName ? directorLabel(shoot.directorName) : '담당 디렉터 확인 중'}
        </p>
        <p>
          <Icon name="clock" size={17} />약 {shoot.package.duration / 60}시간 ·{' '}
          {packageName(shoot.packageId, shoot.package.name)} ({shoot.package.outfits}벌)
        </p>
      </section>
      <section className={styles.guideSection}>
        <div className={layout.between}>
          <h2 className={styles.sectionTitle}>촬영 전 확인할 안내</h2>
          <span className={styles.cyan}>
            {read} / {visibleGuides.length} 확인
          </span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-label="촬영 준비 안내 확인"
          aria-valuenow={read}
          aria-valuemin={0}
          aria-valuemax={visibleGuides.length}
        >
          <span style={{ width: `${(read / visibleGuides.length) * 100}%` }} />
        </div>
        <div className={styles.guideList}>
          {visibleGuides.map((guide) => (
            <CheckItem
              className={styles.guideItem}
              key={guide.id}
              label={guide.title}
              description={guideDescription(guide)}
              completed={completeGuide(guide)}
              disabled={
                busy ||
                (isPlanGuide(guide)
                  ? !shoot.plan?.sharedAt
                  : !isOutfitGuide(guide) && !guides.length)
              }
              onClick={() => openGuide(guide)}
            />
          ))}
        </div>
        {shoot.plan?.sharedAt && !visibleGuides.some(isPlanGuide) && (
          <Button variant="secondary" onClick={() => onNavigate('plan')}>
            촬영 설계 보기
          </Button>
        )}
        {!guides.length && (
          <Notice>촬영 준비 안내를 정리하고 있어요. 담당자에게 준비 일정을 확인해주세요.</Notice>
        )}
      </section>
      <Notice tone="warning" className={styles.preparationWarning}>
        <strong>
          <span aria-hidden="true">⚠</span> 촬영 전날엔 이것만 피해주세요
        </strong>
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
            busy ||
            !guides.length ||
            !guidesReady ||
            !outfitsReady ||
            Boolean(preparation?.confirmedAt)
          }
          onClick={confirmPreparation}
        >
          {preparation?.confirmedAt ? '촬영 준비 확인 완료' : '안내를 모두 확인했어요'}
        </Button>
        <KakaoButton onClick={onHelp}>궁금한 점은 카카오톡으로</KakaoButton>
      </SceneFooter>
      <Dialog
        open={outfitsOpen || Boolean(selected)}
        onOpenChange={(open) => !open && closeGuide()}
        title={outfitsOpen ? '의상 준비 · 사진 올리기' : (selected?.title ?? '촬영 안내')}
        actions={<Button onClick={closeGuide}>확인</Button>}
      >
        {(selected || outfitsOpen) && (
          <div className={layout.stack}>
            {(dialogGuide?.body || !outfitsOpen) && (
              <p className={layout.preWrap}>
                {dialogGuide?.body || '담당자가 안내 내용을 준비하고 있어요.'}
              </p>
            )}
            {dialogGuide?.url && (
              <a
                className={layout.textLink}
                href={dialogGuide.url}
                target="_blank"
                rel="noreferrer"
              >
                안내 자세히 보기 ↗
              </a>
            )}
            {outfitsOpen && (
              <>
                <p>
                  필요한 의상 {shoot.outfitPhotosRequired}벌 · {uploaded.length}장 업로드
                </p>
                {shoot.outfitPhotosRequired > 0 && (
                  <p className={layout.small}>
                    {shoot.outfitDueAt
                      ? `${shootDate(shoot.outfitDueAt)}까지 올려주세요.`
                      : '업로드 기한은 담당자에게 확인해주세요.'}
                  </p>
                )}
                <UploadButton
                  busy={busy}
                  label="의상 사진 올리기"
                  onFile={(file) => onUpload(file, 'outfit')}
                />
                <UploadList items={uploaded} />
              </>
            )}
          </div>
        )}
      </Dialog>
    </>
  );
}

export function PlanView({
  shoot,
  onNavigate,
  onHelp,
  onOpenOutfits,
}: CustomerViewProps & { onOpenOutfits: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const plan = shoot.plan;
  if (!plan?.sharedAt)
    return (
      <>
        <header className={layout.stack}>
          <h1>디렉터가 설계 중이에요</h1>
          <p>촬영 설계가 공유되면 이곳에서 확인할 수 있어요.</p>
        </header>
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
          {directorLabel(shoot.directorName)} ·{' '}
          <time dateTime={plan.sharedAt}>
            {new Date(plan.sharedAt).toLocaleDateString('en-US', {
              timeZone: 'Asia/Seoul',
              month: 'numeric',
              day: 'numeric',
            })}
          </time>
          <br />
          설문을 보고 {shoot.customerName}님께 맞춰 준비했어요.
        </p>
      </header>
      <section className={`${layout.card} ${styles.planDetails}`}>
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
      <section className={`${layout.card} ${styles.planFacts}`}>
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
        <InfoRow label="촬영" value={shootSchedule(shoot)} />
        {plan.note && <p className={layout.small}>디렉터 메모: {plan.note}</p>}
      </section>
      <SceneFooter>
        <Button variant="secondary" fullWidth onClick={onOpenOutfits}>
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
  const finished = shoot.status === 'shoot_complete' || statusInfo(shoot.status).stage > 5;
  const cancelled = shoot.status === 'cancelled';
  const current = finished ? -1 : daySteps.findIndex((step) => step.status === shoot.status);
  const today = daysUntil(shoot.startsAt) === 0;
  const when = today ? `오늘 ${shootTime(shoot.startsAt)}` : shootDate(shoot.startsAt, true);
  const location = shoot.preparation?.location;
  const hair = shoot.preparation?.hair;
  const hasHair =
    shoot.addons.some((addon) => addon.id === 'hair' && addon.quantity > 0) ||
    Boolean(hair) ||
    shoot.status === 'addons_in_progress' ||
    shoot.timeline?.some((item) => item.to === 'addons_in_progress');

  function stepDetail(
    status: string,
    time: string | undefined,
    active: boolean,
    completed: boolean,
  ) {
    if (active) return status === 'shooting' ? '촬영 중' : '진행 중';
    if (cancelled && !completed) return '취소';
    if (status === 'addons_in_progress') {
      return [hair?.time || time, '제휴 샵에서 먼저 (디렉터 미동행)'].filter(Boolean).join(' · ');
    }
    if (status === 'arrived' && (time || location?.meetingPlace))
      return [time, location?.meetingPlace].filter(Boolean).join(' · ');
    if (status === 'outfit_checked' && time) return `${time} · 만남 장소`;
    if (time) return time;
    if (completed) return '완료';
    if (status === 'mid_check') return '찍힌 컷을 함께 보고 방향을 맞춰요';
    if (status === 'shoot_complete') return '셀렉·보정 일정 안내';
    return '진행 예정';
  }

  return (
    <>
      <section className={styles.dayCard}>
        <div className={layout.between}>
          <strong className={styles.dayTitle}>{today ? 'D-DAY' : '촬영 당일'}</strong>
          <span className={finished ? styles.greenPill : styles.redPill}>
            {cancelled
              ? '촬영 취소'
              : finished
                ? '촬영 완료'
                : current >= 0
                  ? '● 촬영 중'
                  : '촬영 대기'}
          </span>
        </div>
        <h1 className={styles.shootDayHeading}>
          {when} ·{' '}
          {cancelled
            ? '촬영이 취소되었어요'
            : `${directorLabel(shoot.directorName)}와 ${finished ? '촬영을 마쳤어요' : current >= 0 ? '촬영 중이에요' : '만나요'}`}
        </h1>
        <p>
          {finished || cancelled
            ? '촬영 당일의 진행 기록이에요.'
            : '디렉터가 단계를 체크하면 여기에도 바로 표시돼요.'}
        </p>
      </section>
      <ol className={styles.dayTimeline}>
        {daySteps
          .filter((step) => hasHair || step.status !== 'addons_in_progress')
          .map((step) => {
            const index = daySteps.indexOf(step);
            const event = shoot.timeline?.find((item) => item.to === step.status);
            const active = current === index;
            const completed = finished || current > index || (cancelled && Boolean(event));
            return (
              <li
                key={step.status}
                data-completed={completed || undefined}
                data-current={active || undefined}
                aria-current={active ? 'step' : undefined}
              >
                <span className={styles.dayDot} aria-hidden="true">
                  {completed ? <Icon name="check" size={15} /> : active ? '●' : ''}
                </span>
                <strong>{step.label}</strong>
                <p>
                  {stepDetail(
                    step.status,
                    event ? shootTime(event.createdAt) : undefined,
                    active,
                    completed,
                  )}
                </p>
              </li>
            );
          })}
      </ol>
      <section className={`${layout.card} ${styles.locationCard}`}>
        <strong className={styles.iconText}>
          <Icon name="solar/map-point-bold" size={17} />
          {location?.meetingPlace || '만남 장소 확인 중'}
          {today && !finished && !cancelled ? ' (오늘 만날 장소)' : ''}
        </strong>
        {hair && (
          <p className={layout.small}>
            헤어 & 메이크업: {[hair.place, hair.note].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className={styles.mapPlaceholder}>
          <Icon name="solar/map-point-bold" size={30} />
          <span>{location?.area || '장소가 정해지면 바로 안내해요'}</span>
        </div>
        <div className={`${layout.actions} ${styles.locationActions}`}>
          {location?.mapUrl ? (
            <a
              className={styles.secondaryLink}
              href={location.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              길찾기
            </a>
          ) : (
            <Button variant="secondary" size="sm" onClick={onHelp}>
              장소 문의
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setParkingOpen(true)}>
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
