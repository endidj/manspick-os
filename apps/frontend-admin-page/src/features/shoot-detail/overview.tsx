// 고객 기본정보와 결제·설문·담당을 왼쪽에, 요청·안내·기록을 오른쪽에 배치합니다.
import { useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import { Button, Panel } from '@manspick/design-system/components';
import { Icon, type IconName } from '@manspick/design-system/icons';
import {
  Dialog,
  InfoRow,
  SectionHeader,
  TextArea,
  TextField,
} from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import type { ReactNode } from 'react';
import { dateTime, money } from '@manspick/web/format';
import { ShootMessages } from './messages';
import { ShootRequests } from './requests';
import { ShootTimeline } from './timeline';
import { BookingSchedule } from './booking-schedule';
import { BookingOperations } from './booking-operations';
import { PreparationEditor } from './preparation-editor';
import { CustomerLink } from './customer-link';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

type Props = {
  shoot: ShootDetail;
  role: StaffRole;
  busy: boolean;
  perform: PerformAction;
  onTabChange: (tab: string) => void;
};
type ActionProps = { shoot: ShootDetail; busy: boolean; perform: PerformAction };

function answer(value: unknown) {
  return Array.isArray(value) ? value.join(' · ') : String(value ?? '미입력');
}

function Heading({ icon, title, extra }: { icon: IconName; title: string; extra?: ReactNode }) {
  return (
    <div className={styles.sectionHeading}>
      <h3 className={styles.panelTitle}>
        <Icon name={icon} size={18} />
        {title}
      </h3>
      {extra}
    </div>
  );
}

export function ShootOverview({ shoot, role, busy, perform, onTabChange }: Props) {
  const [planOpen, setPlanOpen] = useState(false);
  const can = (capability: string) => shoot.capabilities.includes(capability);
  const answers = shoot.survey?.answers ?? {};
  const guides = shoot.preparation?.guides ?? [];
  const basePayment = shoot.payments.find((payment) => payment.kind === 'base');
  const externalPayment = ['kmong', 'frip', 'soomgo', 'smartstore'].includes(
    basePayment?.channel ?? '',
  );
  const paymentLabel =
    shoot.paymentState === 'confirmed'
      ? externalPayment
        ? '외부 플랫폼 결제'
        : '결제 완료'
      : basePayment?.channel === 'bank'
        ? '입금 확인 대기'
        : '결제 확인 대기';
  return (
    <div className={styles.columns}>
      <div className={styles.stack}>
        <Panel className={styles.summaryPanel}>
          <Heading icon="people" title="기본정보" />
          <InfoRow label="연락처" value={shoot.phoneMasked || '미입력'} />
          <InfoRow
            label="나이 · 직업"
            value={`${answer(answers.age)} · ${answer(answers.occupation)}`}
          />
          <InfoRow label="유입" value={answer(answers.referral)} />
          <InfoRow label="생성" value={dateTime(shoot.timeline.at(-1)?.createdAt ?? null)} />
          {(role === 'admin' || role === 'staff') && shoot.status !== 'cancelled' && (
            <CustomerLink key={shoot.id} shootId={shoot.id} />
          )}
        </Panel>
        <Panel className={styles.summaryPanel}>
          <Heading
            icon="solar/tag-price-bold"
            title="패키지 · 옵션"
            extra={<span className={styles.accent}>{money(shoot.totalAmount)}</span>}
          />
          <InfoRow label="패키지" value={shoot.packageName} />
          <InfoRow
            label="부가서비스"
            value={
              shoot.addons
                .map((addon) => `${addon.name}${addon.quantity > 1 ? ` ×${addon.quantity}` : ''}`)
                .join(' · ') || '없음'
            }
          />
          <InfoRow label="의상" value={`${shoot.package.outfits}벌`} />
          <InfoRow
            label="결제 확인"
            value={
              <span className={shoot.paymentState === 'confirmed' ? styles.green : styles.accent}>
                {shoot.paymentState === 'confirmed'
                  ? `${money(shoot.totalAmount)} · ${paymentLabel}`
                  : paymentLabel}
              </span>
            }
          />
          {can('confirm_payment') &&
            shoot.payments
              .filter((payment) => payment.kind === 'base' && payment.state === 'pending')
              .map((payment) => (
                <div className={styles.paymentRow} key={payment.id}>
                  <span>
                    {money(payment.amount)} · {payment.depositor || '입금자 미입력'}
                  </span>
                  <Button
                    size="sm"
                    loading={busy}
                    onClick={() => perform({ type: 'confirm_payment', paymentId: payment.id })}
                  >
                    입금 확인 · 확정
                  </Button>
                </div>
              ))}
          {can('release_hold') && shoot.holdExpiresAt && shoot.paymentState === 'pending' && (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => perform({ type: 'release_hold' })}
            >
              예약 잠금 해제
            </Button>
          )}
        </Panel>
        <Panel className={styles.summaryPanel}>
          <Heading
            icon="solar/document-text-bold"
            title="설문 핵심값"
            extra={
              <Button size="sm" variant="ghost" onClick={() => onTabChange('survey')}>
                전체 보기
              </Button>
            }
          />
          {[
            ['촬영 목적', answers.purposes],
            ['원하는 무드', answers.style],
            ['고민', answers.concerns],
            ['의상', answers.outfits ?? `${shoot.package.outfits}벌`],
          ].map(([label, value]) => (
            <InfoRow key={String(label)} label={String(label)} value={answer(value)} />
          ))}
        </Panel>
        <Panel className={styles.summaryPanel}>
          <Heading icon="calendar" title="담당 · 일정" />
          <InfoRow label="디렉터" value={shoot.directorName ?? '배정 대기'} />
          {role === 'admin' && (
            <Button size="sm" variant="secondary" onClick={() => onTabChange('photos')}>
              예약 내부 사진
            </Button>
          )}
          {can('save_preparation') && (
            <PreparationEditor shoot={shoot} busy={busy} perform={perform} />
          )}{' '}
          {can('share_plan') && (
            <Button size="sm" variant="secondary" onClick={() => setPlanOpen(true)}>
              촬영 설계 편집 · 공유
            </Button>
          )}
        </Panel>
      </div>
      <div className={styles.stack}>
        <Panel
          className={`${styles.summaryPanel} ${shoot.pendingRequests > 0 ? styles.attentionPanel : ''}`}
        >
          <Heading
            icon="solar/document-text-bold"
            title="고객 요청 · 처리할 일"
            extra={<span className={styles.accent}>{shoot.pendingRequests}건</span>}
          />
          <InfoRow label="결제 상태" value={paymentLabel} />
          <InfoRow
            label="안내 확인"
            value={`${guides.length}종 중 ${guides.filter((guide) => guide.readAt).length}종 확인`}
          />
          {shoot.pendingRequests > 0 && (
            <ShootRequests shoot={shoot} busy={busy} perform={perform} compact />
          )}
        </Panel>
        <BookingSchedule shoot={shoot} />
        {(role === 'admin' || role === 'staff') && <ShootMessages shootId={shoot.id} />}
        <div className={styles.lowerColumns}>
          <ShootTimeline shoot={shoot} />
          {can('note') && <NotesEditor shoot={shoot} busy={busy} perform={perform} />}
          {can('add_task') && <BookingOperations shoot={shoot} busy={busy} perform={perform} />}
        </div>
      </div>
      <Dialog open={planOpen} onOpenChange={setPlanOpen} title="고객 촬영 설계">
        <PlanEditor shoot={shoot} busy={busy} perform={perform} />
      </Dialog>
    </div>
  );
}

export function PlanEditor({ shoot, busy, perform }: ActionProps) {
  const [concept, setConcept] = useState(shoot.plan?.concept ?? '');
  const [outfits, setOutfits] = useState(shoot.plan?.outfits ?? '');
  const [note, setNote] = useState(shoot.plan?.note ?? '');
  return (
    <Panel className={styles.stack}>
      <SectionHeader heading="h3" eyebrow="SHOOT PLAN" title="고객에게 전할 촬영 설계" />
      <TextField
        label="촬영 컨셉"
        placeholder="분위기와 표현 방향"
        value={concept}
        onValueChange={setConcept}
        disabled={busy}
      />
      <TextArea
        label="의상별 제안"
        placeholder="의상 구성과 매칭 제안"
        value={outfits}
        onValueChange={setOutfits}
        disabled={busy}
      />
      <TextArea
        label="고객 공개 메모"
        placeholder="준비물과 함께 전할 내용"
        value={note}
        onValueChange={setNote}
        disabled={busy}
      />
      <div className={styles.row}>
        <Button
          size="md"
          loading={busy}
          disabled={!concept.trim()}
          onClick={() => perform({ type: 'share_plan', concept, outfits, note })}
        >
          고객에게 설계 공유
        </Button>
      </div>
      <p className={styles.caption}>
        공유 즉시 고객 준비 화면에 표시됩니다. 실제 알림톡은 발송되지 않습니다.
      </p>
    </Panel>
  );
}

function NotesEditor({ shoot, busy, perform }: ActionProps) {
  const [note, setNote] = useState('');

  async function save() {
    if (await perform({ type: 'note', text: note })) setNote('');
  }

  return (
    <Panel className={styles.stack}>
      <SectionHeader heading="h3" eyebrow="INTERNAL" title="내부 메모" />
      <TextArea
        label="업무 메모"
        value={note}
        onValueChange={setNote}
        placeholder="고객에게 공개되지 않는 업무 메모"
        disabled={busy}
      />
      <div className={styles.row}>
        <Button size="sm" variant="secondary" disabled={!note.trim() || busy} onClick={save}>
          메모 남기기
        </Button>
      </div>
      {shoot.notes.map((entry) => (
        <div className={styles.savedNote} key={entry.id}>
          <p>{entry.text}</p>
          <span>
            {entry.authorName} · {dateTime(entry.createdAt)}
          </span>
        </div>
      ))}
    </Panel>
  );
}
