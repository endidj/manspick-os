// 지금 할 일과 예약 요약·일곱 단계 여정을 상태별로 보여줍니다.
import { Button } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { dateTime, money } from '@manspick/web/format';
import type { ShootDetail } from '@manspick/contracts';
import { resolveJourney, daysUntil, type CustomerScene } from './journey';
import {
  packageSummary,
  prepaidPlatform,
  reviewState,
  shootDate,
  shootSchedule,
  shootTime,
} from './presentation';
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
  onOpenOutfits,
}: {
  shoot: ShootDetail;
  onNavigate: (scene: CustomerScene) => void;
  onHelp: () => void;
  onOpenOutfits: () => void;
}) {
  const journey = resolveJourney(shoot);
  const days = daysUntil(shoot.startsAt);
  const preparation = shoot.preparation;
  const read = preparation?.guides.filter((g) => g.readAt).length ?? 0;
  const required = shoot.package.retouchCount;
  const state = journey.state;
  const homeStage = state === 'results' ? 7 : journey.stage;
  const name = shoot.customerName;
  const platform = prepaidPlatform(shoot.payments.find((item) => item.kind === 'base')?.channel);
  const depositRequested = shoot.requests.some(
    (item) => item.type === 'deposit' && ['new', 'processing'].includes(item.state),
  );
  const instructions = shoot.paymentInstructions;
  const deliveredAt = shoot.timeline?.find((item) => item.to === 'delivered')?.createdAt;
  const surveyPages = new Set(shoot.survey?.pageDone ?? []).size;
  const surveyStarted = surveyPages > 0 || Object.keys(shoot.survey?.answers ?? {}).length > 0;
  const preparationConfirmed = Boolean(preparation?.confirmedAt);
  const guidesRemaining = preparation?.guides.filter((guide) => !guide.readAt).length ?? 0;
  const outfitsMissing = Math.max(
    0,
    shoot.outfitPhotosRequired - shoot.uploads.filter((asset) => asset.kind === 'outfit').length,
  );
  const preparationComplete = preparationConfirmed && outfitsMissing === 0;
  const review = reviewState(shoot);
  const copy =
    state === 'options'
      ? {
          title: `${name}님, 촬영 옵션을 확인해주세요`,
          subtitle: '원하는 촬영과 코디를 알려주세요.',
          task: '촬영 옵션 선택',
          description: '촬영 구성이나 추가 서비스가 궁금하면 카카오톡으로 문의해주세요.',
          cta: '촬영 옵션 문의하기',
        }
      : state === 'payment'
        ? {
            title:
              platform || depositRequested
                ? `${name}님, 결제를 확인하고 있어요`
                : `${name}님, 입금하면 예약이 확정돼요`,
            subtitle: shoot.holdExpiresAt
              ? `고른 일정은 ${dateTime(shoot.holdExpiresAt)}까지 잡아둘게요.`
              : '결제 확인이 끝나면 예약이 확정돼요.',
            task: platform ? '결제 확인 대기' : '입금 확인 대기',
            description: platform
              ? `${platform}에서 결제하신 내역을 확인하고 있어요.`
              : depositRequested
                ? '입금 확인을 요청했어요. 직원이 입금자명과 금액을 확인하고 있어요.'
                : `${instructions ? `${instructions.bankName} ${instructions.accountNumber} · ` : '입금할 금액 · '}${money(shoot.totalAmount)}\n입금 후 ‘입금했어요’를 눌러주세요.`,
            cta: platform || depositRequested ? '확인 상태 보기' : '입금 안내 보기',
          }
        : state === 'survey'
          ? {
              title: `${name}님, 예약이 확정됐어요`,
              subtitle: surveyStarted
                ? '작성 중인 설문을 이어서 마무리해주세요.'
                : '촬영 전에 설문만 남았어요. 10분이면 끝나요.',
              task: `설문 작성${surveyStarted ? ` · ${surveyPages} / 4` : ''}${shoot.survey?.dueAt ? ` · ${shootDate(shoot.survey.dueAt)}까지` : ''}`,
              description: surveyStarted
                ? '저장한 답변부터 이어서 작성할 수 있어요. 마지막 제출까지 완료해주세요.'
                : '디렉터가 설문을 보고 코디와 촬영 장소를 설계해요.',
              cta: surveyStarted ? '설문 이어서 작성하기' : '설문 작성하기',
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
                    subtitle:
                      shoot.selectionMode === 'director'
                        ? '촬영 현장에서 디렉터 셀렉으로 확정했어요.'
                        : "설문에서 '디렉터에게 맡기기'를 고르셨어요.",
                    task: `디렉터 셀렉 중 · ${required}장`,
                    description:
                      '고른 사진은 바로 보정에 들어가요.\n보정본은 평균 1~3일 뒤에 받아보실 수 있어요.',
                    cta: '후보 사진 둘러보기',
                  }
                : state === 'results' || state === 'follow-up'
                  ? review === 'open'
                    ? {
                        title: `${name}님, 원본 사진도 도착했어요`,
                        subtitle: '함께한 순간을 오래 간직해주세요.',
                        task: '원본 사진 공개 완료',
                        description: '보정본과 함께 원본 사진 전체를 확인할 수 있어요.',
                        cta: '원본 사진 확인하기',
                      }
                    : review === 'pending'
                      ? {
                          title: `${name}님, 후기를 확인하고 있어요`,
                          subtitle: '남겨주신 후기 감사합니다.',
                          task: '후기 확인 대기',
                          description: '직원이 후기를 확인하면 원본 사진을 공개해드려요.',
                          cta: '후기 진행상태 보기',
                        }
                      : review === 'approved'
                        ? {
                            title: `${name}님, 원본 사진을 준비하고 있어요`,
                            subtitle: '남겨주신 후기가 확인됐어요.',
                            task: '원본 전달 대기',
                            description: '원본이 공개되면 이곳에서 확인할 수 있어요.',
                            cta: '원본 전달 상태 보기',
                          }
                        : review === 'rejected'
                          ? {
                              title: `${name}님, 후기를 다시 확인해주세요`,
                              subtitle: '제출한 후기에서 확인이 필요한 내용이 있어요.',
                              task: '후기 다시 제출',
                              description: '후기 화면에서 캡처를 확인하고 다시 제출해주세요.',
                              cta: '후기 다시 확인하기',
                            }
                          : {
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
                          subtitle: preparationComplete
                            ? '준비 확인을 마쳤어요. 촬영 당일 안내에 맞춰 와주세요.'
                            : '지금 하실 일은 하나예요. 나머지는 저희가 준비할게요.',
                          task: preparationComplete
                            ? '촬영 준비 확인 완료'
                            : preparationConfirmed && outfitsMissing > 0
                              ? `의상 사진 준비 · ${outfitsMissing}장 남음`
                              : `촬영 준비 확인 · ${read} / ${preparation?.guides.length || 9}`,
                          description: preparationComplete
                            ? '일정과 장소, 준비물은 언제든 다시 확인할 수 있어요.'
                            : [
                                outfitsMissing > 0
                                  ? `의상 사진 ${outfitsMissing}장을 ${shoot.outfitDueAt ? `${shootDate(shoot.outfitDueAt)}까지 ` : ''}더 올려주세요.`
                                  : '',
                                !preparation?.guides.length
                                  ? '담당자가 촬영 준비 안내를 정리하고 있어요.'
                                  : guidesRemaining > 0
                                    ? `확인할 안내가 ${guidesRemaining}개 남았어요.`
                                    : preparationConfirmed
                                      ? ''
                                      : '안내를 모두 읽으셨다면 준비 화면에서 전체 확인을 마쳐주세요.',
                              ]
                                .filter(Boolean)
                                .join(' '),
                          cta: preparationComplete
                            ? '준비 안내 다시 보기'
                            : preparationConfirmed && outfitsMissing > 0
                              ? '의상 사진 올리기'
                              : '준비 안내 이어서 보기',
                        };
  const target = state === 'options' ? null : state === 'results' ? 'review' : journey.scene;

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
          <span>
            {copy.task}
            {state === 'payment' && shoot.holdExpiresAt && (
              <>
                {' '}
                · <HoldCountdown until={shoot.holdExpiresAt} />
              </>
            )}
          </span>
        </h2>
        <p className={layout.preWrap}>{copy.description}</p>
        <Button
          fullWidth
          onClick={() =>
            state === 'shoot-day' && preparation?.location.mapUrl
              ? window.open(preparation.location.mapUrl, '_blank', 'noopener,noreferrer')
              : state === 'preparation' && preparationConfirmed && outfitsMissing > 0
                ? onOpenOutfits()
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
            {state === 'shoot-day' && days === 0 && '오늘 '}
            {homeStage >= 6 && shoot.startsAt
              ? `${shootDate(shoot.startsAt)} ${deliveredAt ? `촬영 · ${shootDate(deliveredAt)} 전달 완료` : '촬영 완료'}`
              : shootSchedule(shoot)}
            {state === 'payment' ? ' · 확정 전' : ''}
          </span>
        </div>
        <div>
          <Icon name="solar/map-point-bold" size={17} />
          <span>
            {preparation?.location.area || '촬영 장소는 정해지면 바로 안내'}
            {homeStage < 6 &&
              preparation?.location.meetingPlace &&
              ` · ${preparation.location.meetingPlace}`}
            {homeStage < 6 && preparation?.location.mapUrl && (
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
              aria-current={current ? 'step' : undefined}
              onClick={() => onNavigate(destination)}
              disabled={state === 'cancelled' || index === 0 || index + 1 > homeStage}
            >
              <span className={styles.journeyNumber}>
                {done ? <Icon name="solar/check-circle-bold" size={14} /> : index + 1}
              </span>
              <span>{label}</span>
              <span className={styles.journeyState}>
                {done
                  ? '완료'
                  : current
                    ? state === 'payment'
                      ? platform
                        ? '결제 확인 대기'
                        : '입금 대기'
                      : state === 'survey'
                        ? surveyStarted
                          ? '작성 중'
                          : '작성 전'
                        : state === 'shoot-day'
                          ? '오늘'
                          : state === 'selection'
                            ? '셀렉 대기'
                            : state === 'director-selection'
                              ? '디렉터 셀렉 중'
                              : state === 'preparation' && preparationComplete
                                ? '확인 완료'
                                : state === 'results' || state === 'follow-up'
                                  ? review === 'open'
                                    ? '원본 공개'
                                    : review === 'pending'
                                      ? '후기 확인 중'
                                      : review === 'approved'
                                        ? '원본 전달 대기'
                                        : review === 'rejected'
                                          ? '재확인 필요'
                                          : '후기 대기'
                                  : '진행 중'
                    : ''}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
