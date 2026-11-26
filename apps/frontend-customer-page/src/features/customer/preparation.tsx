// 준비 안내 열람·공유 설계·당일 진행을 실제 촬영 데이터로 보여줍니다.
'use client';

import { useState } from 'react';
import { Button, CheckItem, Notice } from '@manspick/design-system/components';
import { Dialog, InfoRow } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { statusInfo } from '@manspick/domain';
import type { PreparationDTO } from '@manspick/contracts';
import { SceneFooter, KakaoButton } from '../shell';
import type { CustomerViewProps } from './view-types';
import { daysUntil } from './journey';
import { shootDate, shootSchedule, shootTime } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

type Guide = PreparationDTO['guides'][number];

function directorLabel(name: string | null) {
  if (!name?.trim()) return '담당 디렉터';
  return name.trim().endsWith('디렉터') ? name.trim() : `${name.trim()} 디렉터`;
}

export function PreparationView({ shoot, busy, onAction, onNavigate }: CustomerViewProps) {
  const [selected, setSelected] = useState<Guide>();
  const preparation = shoot.preparation;
  const guides = preparation?.guides ?? [];
  return (
    <div className={layout.stack}>
      <h1>촬영 준비 안내</h1>
      <InfoRow label="촬영 일시" value={shoot.startsAt ? shootSchedule(shoot) : '일정 확정 전'} />
      <InfoRow
        label="만남 장소"
        value={shoot.confirmedSchedule?.location || preparation?.location.meetingPlace || '미정'}
      />
      {shoot.plan?.sharedAt && (
        <Button variant="secondary" onClick={() => onNavigate('plan')}>
          촬영 설계 보기
        </Button>
      )}
      <h2>촬영 전 확인할 안내</h2>
      {guides.length ? (
        guides.map((guide) => (
          <CheckItem
            key={guide.id}
            label={guide.title}
            description={guide.summary}
            completed={Boolean(guide.readAt)}
            disabled={busy}
            onClick={() => setSelected(guide)}
          />
        ))
      ) : (
        <Notice>담당자가 준비 안내를 작성하고 있어요.</Notice>
      )}
      {guides.length > 0 && (
        <Button
          disabled={
            busy || Boolean(preparation?.confirmedAt) || guides.some((guide) => !guide.readAt)
          }
          onClick={() => void onAction({ type: 'confirm_preparation' })}
        >
          {preparation?.confirmedAt ? '준비 안내 확인 완료' : '준비 안내 전체 확인'}
        </Button>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(undefined);
        }}
        title={selected?.title ?? '준비 안내'}
      >
        <p>{selected?.body}</p>
        {selected?.url && (
          <a href={selected.url} target="_blank" rel="noreferrer">
            안내 자세히 보기
          </a>
        )}
        <Button
          disabled={busy}
          onClick={async () => {
            if (
              selected &&
              (selected.readAt ||
                (await onAction({ type: 'mark_preparation_read', guideId: selected.id })))
            )
              setSelected(undefined);
          }}
        >
          확인
        </Button>
      </Dialog>
    </div>
  );
}

export function PlanView({ shoot, onNavigate, onHelp }: CustomerViewProps) {
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
          <Icon name="solar/check-circle-bold" size={36} />
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
          <Icon name="solar/check-circle-bold" size={20} />
          컨셉 · {plan.concept}
        </p>
        {plan.outfits
          .split('\n')
          .filter(Boolean)
          .map((outfit, index) => (
            <p className={styles.iconText} key={`${index}-${outfit}`}>
              <Icon name="solar/magic-stick-3-bold" size={20} />
              {outfit}
            </p>
          ))}
      </section>
      <section className={`${layout.card} ${styles.planFacts}`}>
        <p className={styles.planCaption}>촬영 장소 · 시간</p>
        <InfoRow label="동네" value={shoot.preparation?.location.area || '정해지면 바로 안내'} />
        <InfoRow
          label="만남"
          value={
            shoot.confirmedSchedule?.location ||
            shoot.preparation?.location.meetingPlace ||
            '정해지면 바로 안내'
          }
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
        <KakaoButton onClick={onHelp}>디렉터에게 카톡으로 문의</KakaoButton>
      </SceneFooter>
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
    if (status === 'shoot_complete') return '촬영 마무리 안내';
    return '진행 예정';
  }

  return (
    <>
      <section className={`${styles.dayCard} ${styles.shootDayCard}`}>
        <div className={layout.between}>
          <strong className={styles.dayTitle}>{today ? 'D-DAY' : '촬영 당일'}</strong>
          <span
            className={finished ? styles.greenPill : styles.redPill}
            data-live={(!cancelled && current >= 0) || undefined}
          >
            {cancelled
              ? '촬영 취소'
              : finished
                ? '촬영 완료'
                : current >= 0
                  ? '촬영 중'
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
                  {completed && <Icon name="check" size={15} />}
                </span>
                <strong>{step.label}</strong>
                <p>
                  {stepDetail(
                    step.status,
                    event ? shootTime(event.createdAt, '24h') : undefined,
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
          {shoot.confirmedSchedule?.location || location?.meetingPlace || '만남 장소 확인 중'}
          {today && !finished && !cancelled ? ' (오늘 만남 장소)' : ''}
        </strong>
        {hair && (
          <p className={layout.small}>
            헤어 & 메이크업: {[hair.place, hair.note].filter(Boolean).join(' · ')}
          </p>
        )}
        {location?.mapUrl ? (
          <a
            className={styles.mapPlaceholder}
            href={location.mapUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${location.meetingPlace || location.area || '만남 장소'} 지도 열기`}
          />
        ) : (
          <div className={styles.mapPlaceholder}>
            <Icon name="solar/map-point-bold" size={30} />
            <span>{location?.area || '장소가 정해지면 바로 안내해요'}</span>
          </div>
        )}
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
