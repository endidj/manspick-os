// 실제 입금 안내와 확인 요청을 보여주고 서버의 예약 유지 기한을 계산합니다.
'use client';

import { useEffect, useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import { InfoRow, SummaryCard, TextField } from '@manspick/design-system/patterns';
import { money } from '@manspick/web/format';
import type { ShootDetail } from '@manspick/contracts';
import { SceneFooter } from '../shell';
import { packageSummary, shootDate } from './presentation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

export function HoldCountdown({ until }: { until: string }) {
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
      {[Math.floor(remaining / 3600), Math.floor((remaining % 3600) / 60), remaining % 60]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')}{' '}
      남음
    </span>
  );
}

export function PaymentView({
  shoot,
  busy,
  onAction,
  onHelp,
}: {
  shoot: ShootDetail;
  busy: boolean;
  onAction: (body: unknown, message?: string) => Promise<boolean>;
  onHelp: () => void;
}) {
  const [depositor, setDepositor] = useState(shoot.customerName);
  const [copyMessage, setCopyMessage] = useState('');
  const requested = shoot.requests.some(
    (r) => r.type === 'deposit' && ['new', 'processing'].includes(r.state),
  );
  const instructions = shoot.paymentInstructions;

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage('복사했어요.');
    } catch {
      setCopyMessage('복사하지 못했어요. 내용을 직접 선택해 복사해주세요.');
    }
  }

  return (
    <>
      <header className={layout.stack}>
        <p className={layout.overline}>STEP 2 · 결제</p>
        <h1>
          {shoot.paymentState === 'confirmed' ? '예약이 확정됐어요' : '입금하면 예약이 확정돼요'}
        </h1>
        <p>
          아래 입금 확인 기한 안에 입금해주세요.
          <br />
          입금이 확인되면 확정 안내를 보내드려요.
        </p>
      </header>
      {shoot.holdExpiresAt && (
        <Notice tone="warning">
          <strong>
            <HoldCountdown until={shoot.holdExpiresAt} /> · {shootDate(shoot.holdExpiresAt, true)}
            까지
          </strong>
          <p>기한이 지나면 잡아둔 일정이 해제될 수 있어요.</p>
        </Notice>
      )}
      <SummaryCard
        label="예약한 촬영"
        value={
          <>
            {shootDate(shoot.startsAt, true)}
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
      {instructions ? (
        <SummaryCard
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
        <Notice>
          입금 계좌는 상담 채널에서 확인해주세요. 등록된 계좌가 없어 임의 계좌를 표시하지 않습니다.
        </Notice>
      )}
      <SummaryCard
        label="입금할 금액"
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
      <TextField
        label="입금자명"
        value={depositor}
        onValueChange={setDepositor}
        maxLength={40}
        hint="예약자 이름과 다르게 입금하시면 꼭 적어주세요."
      />
      {requested && (
        <Notice tone="success">입금 확인을 요청했어요. 직원이 확인하면 예약이 확정돼요.</Notice>
      )}
      {shoot.paymentState === 'confirmed' && <InfoRow label="결제 상태" value="확인 완료" />}
      <SceneFooter>
        <Button
          fullWidth
          loading={busy}
          disabled={busy || !depositor.trim() || requested || shoot.paymentState !== 'pending'}
          onClick={() => onAction({ type: 'request_deposit', depositor: depositor.trim() })}
        >
          {requested ? '입금 확인 요청 완료' : '입금했어요'}
        </Button>
        <p>입금자명과 금액을 직원이 확인하면 바로 확정돼요.</p>
      </SceneFooter>
    </>
  );
}
