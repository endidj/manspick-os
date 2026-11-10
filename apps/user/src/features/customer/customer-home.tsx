// 지금 할 일과 예약 요약·일곱 단계 여정을 상태별로 보여줍니다.
import { Button, Notice } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import type { ShootDetail } from '@manspick/contracts';
import { resolveJourney, daysUntil, type CustomerScene } from './journey';
import { packageSummary, shootDate, shootTime } from './presentation';
import { HoldCountdown } from './payment';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

const journeyLabels = [
  '촬영 옵션 선택',
  '촬영 일정 선택',
  '설문 작성',
  '촬영 준비 확인',
  '촬영 진행',
  '결과물 확인',
  '후속 혜택 확인',
];
const journeyScenes: CustomerScene[] = [
  'home',
  'payment',
  'survey',
  'preparation',
  'shoot-day',
  'results',
  'review',
];

export function CustomerHome({
  shoot,
  onNavigate,
  onHelp,
}: {
  shoot: ShootDetail;
  onNavigate: (scene: CustomerScene) => void;
  onHelp: () => void;
}) {
  const journey = resolveJourney(shoot);
  const days = daysUntil(shoot.startsAt);
  const preparation = shoot.preparation;
  const read = preparation?.guides.filter((g) => g.readAt).length ?? 0;
  const required = shoot.package.retouchCount;
  const state = journey.state;
  const homeStage = state === 'results' ? 7 : journey.stage;
  const name = shoot.customerName;
  const copy =
    state === 'payment'
      ? {
          title: '입금하면 예약이 확정돼요',
          subtitle: '고른 일정은 입금 확인 기한까지 잡아둘게요.',
          task: '입금 확인 대기',
          description: '입금 후 입금 안내 화면에서 알려주세요.',
          cta: '입금 안내 보기',
        }
      : state === 'survey'
        ? {
            title: `${name}님, 예약이 확정됐어요`,
            subtitle: '촬영 전에 설문만 남았어요. 10분이면 끝나요.',
            task: `설문 작성${shoot.survey?.dueAt ? ` · ${shootDate(shoot.survey.dueAt)}까지` : ''}`,
            description: '디렉터가 설문을 보고 코디와 촬영 장소를 설계해요.',
            cta: '설문 작성하기',
          }
        : state === 'shoot-day'
          ? {
              title: `${name}님, 오늘 촬영날이에요`,
              subtitle: '편하게 오세요. 디렉터가 먼저 나가 있을게요.',
              task: `${shootTime(shoot.startsAt)} · ${preparation?.location.meetingPlace || '만남 장소 확인'}`,
              description: `의상 ${shoot.outfitPhotosRequired}벌과 신발을 챙겨주세요.\n늦을 것 같으면 카카오톡으로 알려주세요.`,
              cta: preparation?.location.mapUrl ? '지도 보기' : '촬영 진행 확인',
            }
          : state === 'selection'
            ? {
                title: `${name}님, 사진이 도착했어요`,
                subtitle: '마음에 드는 것을 골라주시면 보정을 시작해요.',
                task: `결과물 셀렉 · ${required}장 고르기`,
                description: `후보 사진 중 보정받을 ${required}장을 골라주세요.\n보정본은 평균 1~3일 뒤에 받아보실 수 있어요.`,
                cta: '사진 고르러 가기',
              }
            : state === 'director-selection'
              ? {
                  title: `${name}님, 사진을 고르는 중이에요`,
                  subtitle: "설문에서 '디렉터에게 맡기기'를 고르셨어요.",
                  task: `디렉터 셀렉 중 · ${required}장`,
                  description:
                    '고른 사진은 바로 보정에 들어가요.\n보정본은 평균 1~3일 뒤에 받아보실 수 있어요.',
                  cta: '후보 사진 둘러보기',
                }
              : state === 'results' || state === 'follow-up'
                ? {
                    title: `${name}님, 보정본을 모두 받으셨어요`,
                    subtitle: '후기를 남겨주시면 원본 사진 전체를 드려요.',
                    task: '후기 남기고 원본 받기',
                    description: '후기를 확인하면 원본 전체를 보내드려요.',
                    cta: '후기 남기기',
                  }
                : state === 'retouching'
                  ? {
                      title: `${name}님, 사진을 준비하고 있어요`,
                      subtitle: '담당 보정가가 고르신 사진을 완성하고 있어요.',
                      task: '보정 작업 진행 중',
                      description: '보정본은 평균 1~3일 뒤에 받아보실 수 있어요.',
                      cta: '결과물 진행 확인',
                    }
                  : state === 'cancelled'
                    ? {
                        title: '취소된 촬영이에요',
                        subtitle: '예약 변경이나 문의는 상담 채널로 알려주세요.',
                        task: '촬영 취소',
                        description: '결제 환불 여부는 상담 채널에서 확인해주세요.',
                        cta: '문의하기',
                      }
                    : {
                        title: `${name}님, ${days !== null && days > 0 ? `촬영까지 ${days}일 남았어요` : '촬영을 함께 준비해요'}`,
                        subtitle: '지금 하실 일은 하나예요. 나머지는 저희가 준비할게요.',
                        task: `촬영 준비 확인 · ${read} / ${preparation?.guides.length ?? 9}`,
                        description: `의상 사진을 ${shoot.outfitDueAt ? `${shootDate(shoot.outfitDueAt)}까지 ` : ''}올려주세요. 확인할 안내도 ${Math.max(0, (preparation?.guides.length ?? 9) - read)}개 남았어요.`,
                        cta: '준비 안내 이어서 보기',
                      };
  const target = state === 'results' ? 'review' : journey.scene;

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>MY SHOOT</p>
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>
      </header>
      <section className={styles.nextAction} aria-labelledby="next-action-title">
        <h2 id="next-action-title">
          <Icon name="solar/checklist-minimalistic-bold" size={19} />
          {copy.task}
          {state === 'payment' && shoot.holdExpiresAt && (
            <>
              {' '}
              · <HoldCountdown until={shoot.holdExpiresAt} />
            </>
          )}
        </h2>
        <p className={layout.preWrap}>{copy.description}</p>
        <Button
          fullWidth
          onClick={() =>
            state === 'shoot-day' && preparation?.location.mapUrl
              ? window.open(preparation.location.mapUrl, '_blank', 'noopener,noreferrer')
              : target
                ? onNavigate(target)
                : onHelp()
          }
        >
          {copy.cta}
        </Button>
      </section>
      <section className={styles.reservationCard} aria-label="예약 내용">
        <div>
          <Icon name="solar/calendar-bold" size={17} />
          <span>
            {shootDate(shoot.startsAt, true)}
            {state === 'payment' ? ' · 확정 전' : ''}
          </span>
        </div>
        <div>
          <Icon name="solar/map-point-bold" size={17} />
          <span>
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
          </span>
        </div>
        <div>
          <Icon name="solar/user-bold" size={17} />
          <span>
            담당 디렉터{' '}
            {state === 'payment' ? '확정 후 안내' : (shoot.directorName ?? '확정 후 안내')}
          </span>
        </div>
        <div>
          <Icon name="solar/tag-price-bold" size={17} />
          <span>{packageSummary(shoot)}</span>
        </div>
      </section>
      <nav className={styles.journeyCard} aria-label="나의 촬영 여정">
        {journeyLabels.map((label, index) => {
          const current = index + 1 === homeStage;
          const done = index + 1 < homeStage;
          const destination =
            index === 2 && shoot.survey?.submittedAt
              ? 'survey-complete'
              : index === 5
                ? state === 'selection' || state === 'director-selection'
                  ? 'selection'
                  : 'results'
                : journeyScenes[index];
          return (
            <button
              key={label}
              className={styles.journeyRow}
              data-current={current || undefined}
              data-completed={done || undefined}
              onClick={() => onNavigate(destination)}
              disabled={state === 'cancelled' || index === 0 || index + 1 > homeStage}
            >
              <span className={styles.journeyNumber}>
                {done ? <Icon name="check" size={13} /> : index + 1}
              </span>
              <span>{label}</span>
              <span className={styles.journeyState}>
                {done
                  ? '완료'
                  : current
                    ? state === 'payment'
                      ? '입금 대기'
                      : state === 'survey'
                        ? '작성 전'
                        : state === 'shoot-day'
                          ? '오늘'
                          : state === 'selection'
                            ? '셀렉 대기'
                            : state === 'director-selection'
                              ? '디렉터 셀렉 중'
                              : '진행 중'
                    : ''}
              </span>
            </button>
          );
        })}
      </nav>
      {state === 'cancelled' && <Notice>취소 기록과 파일 접근 범위는 서버 응답을 따릅니다.</Notice>}
    </>
  );
}
