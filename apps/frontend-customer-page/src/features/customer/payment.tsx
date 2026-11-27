// 실제 입금 안내와 확인 요청을 보여주고 서버의 예약 유지 기한을 계산합니다.
'use client';

import { useEffect, useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import { InfoRow, SummaryCard, TextField } from '@manspick/design-system/patterns';
import { dateTime, money } from '@manspick/web/format';
import type { ShootDetail } from '@manspick/contracts';
import { SceneFooter } from '../shell';
import { packageSummary, prepaidPlatform, shootDate } from './presentation';
import type { CustomerScene } from './journey';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

export function HoldCountdown({
  until,
  showPrefix = false,
}: {
  until: string;
  showPrefix?: boolean;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    const update = () =>
      setRemaining(Math.max(0, Math.floor((Date.parse(until) - Date.now()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [until]);
  if (remaining === null) return <span>남은 시간 확인 중</span>;
  if (remaining === 0) return <span>입금 확인 기한 종료</span>;
  return (
    <span>
      {showPrefix && '남은 시간 '}
      {[Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')}
      {!showPrefix && ' 남음'}
    </span>
  );
}

export function PaymentView({
  shoot,
  busy,
  onAction,
  onHelp,
  onNavigate,
  onRefresh,
  refreshing,
}: {
  shoot: ShootDetail;
  busy: boolean;
  onAction: (body: unknown, message?: string) => Promise<boolean>;
  onHelp: () => void;
  onNavigate: (scene: CustomerScene) => void;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}) {
  const [depositor, setDepositor] = useState(shoot.customerName);
  const [copyMessage, setCopyMessage] = useState('');
  const requested = shoot.requests.some(
    (r) => r.type === 'deposit' && ['new', 'processing'].includes(r.state),
  );
  const instructions = shoot.paymentInstructions;
  const channel = shoot.payments.find((payment) => payment.kind === 'base')?.channel;
  const platform = prepaidPlatform(channel);
  const awaitingStaff = Boolean(platform) || channel === 'pg';

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage('복사했어요.');
    } catch {
      setCopyMessage('복사하지 못했어요. 내용을 직접 선택해 복사해주세요.');
    }
  }

  if (shoot.status === 'cancelled') {
    return (
      <>
        <h1>취소된 촬영이에요</h1>
        <Notice>예약 변경과 결제 내역은 담당자에게 확인해주세요.</Notice>
        <SceneFooter>
          <Button fullWidth onClick={() => onNavigate('home')}>
            나의 촬영 홈으로
          </Button>
        </SceneFooter>
      </>
    );
  }

  if (shoot.paymentState === 'confirmed') {
    const needsSurvey = !shoot.survey?.submittedAt && shoot.stage <= 4;
    return (
      <>
        <header className={layout.stack}>
          <p className={layout.overline}>STEP 2 · 결제</p>
          <h1>{platform ? `${platform}에서 결제한 예약이에요` : '결제가 확인됐어요'}</h1>
          <p>
            {needsSurvey
              ? '설문을 작성하면 담당 디렉터가 희망 일정 중 하나를 확정해요.'
              : '나의 촬영 홈에서 다음 진행상태를 확인해주세요.'}
          </p>
        </header>
        <Notice tone="success">
          {platform ? '외부 플랫폼 결제 · 예약 완료' : '결제 확인 완료'}
        </Notice>
        <SummaryCard
          label="예약한 촬영"
          value={
            <>
              {shootDate(shoot.startsAt, true)}
              <br />
              {packageSummary(shoot)}
            </>
          }
        />
        <InfoRow
          label={platform ? '예약한 촬영 금액' : '확인된 결제 금액'}
          value={money(shoot.totalAmount)}
        />
        <SceneFooter>
          {needsSurvey && (
            <Button fullWidth onClick={() => onNavigate('survey')}>
              {shoot.survey?.pageDone.length ? '설문 이어서 작성하기' : '설문 작성하기'}
            </Button>
          )}
          <Button
            variant={needsSurvey ? 'secondary' : 'primary'}
            fullWidth
            onClick={() => onNavigate('home')}
          >
            나의 촬영 홈으로
          </Button>
        </SceneFooter>
      </>
    );
  }

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 2 · 결제</p>
        <h1>
          {awaitingStaff
            ? '결제 확인을 기다리고 있어요'
            : requested
              ? '입금 확인을 기다리고 있어요'
              : '예약 금액을 입금해주세요'}
        </h1>
        <p>
          {platform ? (
            `${platform}에서 결제하신 내역을 직원이 확인하고 있어요.`
          ) : channel === 'pg' ? (
            '이전에 접수한 주문이에요. 직원이 기존 결제 내역을 확인하고 있어요.'
          ) : requested ? (
            '직원이 입금자명과 금액을 확인하고 있어요. 확인이 끝나면 설문을 작성할 수 있어요.'
          ) : (
            <>
              {instructions
                ? '아래 계좌로 기한 안에 입금해주세요.'
                : '입금 계좌는 카카오채널로 문의해주세요.'}
              <br />
              직원이 입금을 확인하면 설문을 작성할 수 있어요.
            </>
          )}
        </p>
      </header>
      {shoot.holdExpiresAt && (
        <Notice tone="warning" role="note" className={styles.paymentDeadline}>
          <strong>
            <HoldCountdown until={shoot.holdExpiresAt} showPrefix /> ·{' '}
            {dateTime(shoot.holdExpiresAt)}
            까지
          </strong>
          <p>
            {!requested && !awaitingStaff && (
              <>
                입금한 뒤 ‘입금했어요’를 눌러주세요.
                <br />
              </>
            )}
            기한이 지나면 예약 신청이 취소될 수 있어요.
          </p>
        </Notice>
      )}
      <SummaryCard
        className={styles.paymentCard}
        label="예약한 촬영"
        value={
          <>
            {dateTime(shoot.startsAt)}
            <br />
            {packageSummary(shoot)}
          </>
        }
        action={
          <button className={styles.textAction} onClick={onHelp}>
            일정 변경
          </button>
        }
      />
      {awaitingStaff ? (
        <SummaryCard
          className={styles.paymentCard}
          label="결제 경로"
          value={platform ?? '자사몰 테스트 주문'}
        />
      ) : instructions ? (
        <SummaryCard
          className={styles.paymentCard}
          label="입금 계좌"
          value={
            <>
              {instructions.bankName} {instructions.accountNumber}
              <br />
              예금주 {instructions.accountHolder}
            </>
          }
          action={
            <button
              className={styles.textAction}
              onClick={() => copy(`${instructions.bankName} ${instructions.accountNumber}`)}
            >
              복사
            </button>
          }
        />
      ) : (
        <Notice>입금 계좌는 맨즈픽 카카오채널에서 확인해주세요.</Notice>
      )}
      <SummaryCard
        className={styles.paymentCard}
        label={awaitingStaff ? '촬영 금액' : '입금할 금액'}
        value={money(shoot.totalAmount)}
        action={
          <button className={styles.textAction} onClick={() => copy(String(shoot.totalAmount))}>
            복사
          </button>
        }
      />
      {copyMessage && (
        <p className={layout.small} role="status">
          {copyMessage}
        </p>
      )}
      {!awaitingStaff && (
        <div className={styles.depositor}>
          <TextField
            label="입금자명"
            className={styles.depositorField}
            data-filled={Boolean(depositor.trim()) || undefined}
            value={depositor}
            onValueChange={setDepositor}
            maxLength={40}
            hint="예약자 이름과 다르게 입금하시면 꼭 적어주세요."
          />
        </div>
      )}
      {!awaitingStaff && requested && (
        <Notice tone="success">
          입금 확인을 요청했어요. 직원이 확인하면 설문을 작성할 수 있어요.
        </Notice>
      )}
      <SceneFooter>
        {!awaitingStaff && (
          <Button
            fullWidth
            loading={busy}
            disabled={busy || !depositor.trim() || requested || shoot.paymentState !== 'pending'}
            onClick={() => onAction({ type: 'request_deposit', depositor: depositor.trim() })}
          >
            {requested ? '입금 확인 요청 완료' : '입금했어요'}
          </Button>
        )}
        {(requested || awaitingStaff) && (
          <Button
            variant={awaitingStaff ? 'primary' : 'secondary'}
            fullWidth
            loading={refreshing}
            disabled={busy}
            onClick={() => void onRefresh()}
          >
            {awaitingStaff ? '결제 확인 상태 새로고침' : '입금 확인 상태 새로고침'}
          </Button>
        )}
        {!awaitingStaff && (
          <p className={styles.paymentFooterHint}>
            입금자명과 금액을 직원이 확인하면 설문을 작성할 수 있어요.
          </p>
        )}
      </SceneFooter>
    </>
  );
}
