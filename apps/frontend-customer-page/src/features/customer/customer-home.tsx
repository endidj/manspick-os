// 고객이 신청한 희망 일정과 디렉터가 확정한 촬영 안내, 다음 할 일을 보여줍니다.
import type { ShootDetail } from '@manspick/contracts';
import { Button, Panel } from '@manspick/design-system/components';
import { InfoRow } from '@manspick/design-system/patterns';
import { resolveJourney, type CustomerScene } from './journey';
import { packageSummary, prepaidPlatform, shootSchedule } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

export function CustomerHome({
  shoot,
  onNavigate,
  onHelp,
}: {
  shoot: ShootDetail;
  onNavigate: (scene: CustomerScene) => void;
  onHelp: () => void;
}) {
  const { state, scene } = resolveJourney(shoot);
  const labels = {
    options: '촬영 옵션 문의하기',
    payment: '결제 안내 보기',
    survey: shoot.survey?.pageDone.length ? '설문 이어서 작성하기' : '설문 작성하기',
    preparation: '촬영 준비 안내 보기',
    'shoot-day': '촬영 진행 확인',
    complete: '촬영 완료',
    cancelled: '촬영 취소',
  };
  const payment = shoot.payments.find((entry) => entry.kind === 'base');
  const platform = prepaidPlatform(payment?.channel);
  const testOrder = payment?.channel === 'pg';
  const action =
    state === 'payment'
      ? platform || testOrder
        ? '확인 상태 보기'
        : '입금 안내 보기'
      : labels[state];
  const options = shoot.timeOptions ?? [];
  const confirmation = shoot.confirmedSchedule;
  const selected = options.find((option) => option.id === confirmation?.optionId);
  const schedule = selected
    ? `${selected.date} ${selected.time}`
    : !options.length && shoot.startsAt
      ? shootSchedule(shoot)
      : '';
  return (
    <div className={layout.stack}>
      <header className={layout.stack}>
        <h1>{shoot.customerName}님의 촬영</h1>
        <p>{packageSummary(shoot)}</p>
      </header>
      <Panel>
        <h2>촬영 일정</h2>
        <InfoRow
          label="확정 일정"
          value={schedule || (state === 'cancelled' ? '취소' : '담당 디렉터 확인 중')}
        />
        {(confirmation?.location || shoot.preparation?.location.meetingPlace) && (
          <InfoRow
            label="만남 장소"
            value={confirmation?.location || shoot.preparation!.location.meetingPlace}
          />
        )}
        {options.length > 0 && !confirmation && (
          <>
            <h3>제출한 희망 일정</h3>
            <ul>
              {options.map((option) => (
                <li key={option.id}>
                  {option.date} {option.time}
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
      {Boolean(shoot.notices?.length) && (
        <Panel>
          <h2>촬영 안내</h2>
          <ul>
            {shoot.notices!.map((notice) => (
              <li key={notice.id}>
                <p>{notice.body}</p>
                <time dateTime={notice.createdAt}>
                  {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                    timeZone: 'Asia/Seoul',
                  })}
                </time>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <section className={styles.nextAction}>
        <h2>{state === 'cancelled' || state === 'complete' ? action : '다음 할 일'}</h2>
        {state === 'payment' && (
          <p>
            {platform
              ? `${platform}에서 결제하신 내역을 확인하고 있어요.`
              : testOrder
                ? '테스트 주문의 수납 확인을 기다리고 있어요.'
                : shoot.paymentInstructions
                  ? `${shoot.paymentInstructions.bankName} ${shoot.paymentInstructions.accountNumber} · ${shoot.totalAmount.toLocaleString('ko-KR')}원`
                  : '결제 확인 내역을 확인해주세요.'}
          </p>
        )}
        {scene && state !== 'complete' && (
          <Button onClick={() => (scene === 'home' ? onHelp() : onNavigate(scene))}>
            {action}
          </Button>
        )}
        {state === 'cancelled' && (
          <Button variant="secondary" onClick={onHelp}>
            예약 문의하기
          </Button>
        )}
      </section>
      <nav aria-label="나의 촬영 여정" className={layout.stack}>
        {state !== 'cancelled' && (
          <Button variant="secondary" onClick={() => onNavigate('payment')}>
            결제 내역
          </Button>
        )}
        {state === 'survey' && (
          <button type="button" onClick={() => onNavigate('survey')}>
            설문 작성
          </button>
        )}
        {shoot.survey?.submittedAt && (
          <Button variant="secondary" onClick={() => onNavigate('survey-complete')}>
            제출한 설문
          </Button>
        )}
        {shoot.plan?.sharedAt && (
          <Button variant="secondary" onClick={() => onNavigate('plan')}>
            촬영 설계
          </Button>
        )}
      </nav>
    </div>
  );
}
