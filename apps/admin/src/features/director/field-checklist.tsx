// 현장 여덟 단계를 저장하고 셀렉 주체를 확정한 뒤 후보 업로드로 이동합니다.
import { useState } from 'react';
import { Button, CheckItem, Panel, StageBadge } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { RadioPills, TextField } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import { shootHref } from '../workspace/model';
import type { PerformAction } from '../shoot-detail/use-shoot-detail';
import { MobileHeader } from './mobile-header';
import styles from './director.module.css';

const steps = [
  ['arrival', '만남 장소 도착', '만남 장소와 고객 도착을 확인해주세요'],
  ['addons', '부가서비스 확인', '선택한 부가서비스 진행을 확인해주세요'],
  ['icebreaking', '아이스브레이킹', '촬영 목적 · 걱정 포인트 다시 묻기'],
  ['sequence', '촬영 순서 리마인드', '의상과 장소의 촬영 순서를 확인해주세요'],
  ['outfits', '의상 점검', '셔츠 주름 · 니트 보풀 · 액세서리'],
  ['shooting', '촬영', '웃는 표정 컷은 대화하며 자연스럽게'],
  ['midcheck', '중간 확인', '모니터로 촬영 결과를 함께 보고 방향 조정'],
  ['closing', '마무리 안내', '셀렉 방법 · 결과물 일정 · 후기 이벤트'],
] as const;

export function FieldChecklist({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [checks, setChecks] = useState(shoot.fieldChecklist.checks);
  const [selector, setSelector] = useState<'customer' | 'director'>(
    shoot.selectionMode ??
      (shoot.survey?.answers.selector === 'director' ? 'director' : 'customer'),
  );
  const [reason, setReason] = useState(shoot.selectorReason);
  const [note, setNote] = useState(shoot.fieldMemo);
  const finished = Boolean(shoot.fieldChecklist.completedAt);
  const allowed = shoot.capabilities.includes('save_field_checklist') && !finished;

  async function save(next = checks) {
    return perform({ type: 'save_field_checklist', checks: next, selector, reason, note });
  }

  async function toggle(key: string) {
    const next = checks.includes(key) ? checks.filter((item) => item !== key) : [...checks, key];
    if (await save(next)) setChecks(next);
  }

  async function finish() {
    if ((await save()) && (await perform({ type: 'complete_field' })))
      window.location.assign(shootHref(shoot.id, 'candidates'));
  }

  return (
    <div className={styles.mobile}>
      <MobileHeader
        title="촬영 당일"
        subtitle="DIRECTOR · 3-3"
        back={shootHref(shoot.id, 'manage')}
        actions={<StageBadge stage={5} label="촬영" />}
      />
      <Panel className={styles.summary}>
        <div className={styles.cardTop}>
          <h1>
            {shoot.customerName} · {dateTime(shoot.startsAt)}
          </h1>
          <span className={styles.status}>{finished ? '완료' : '진행 중'}</span>
        </div>
        <p>
          {shoot.packageName}
          {shoot.addons.length ? ` + ${shoot.addons.map((a) => a.name).join(' · ')}` : ''}
        </p>
        <div className={styles.filters}>
          <span>목적: {String(shoot.survey?.answers.purpose ?? '미입력')}</span>
          <span>의상 {shoot.package.outfits}벌</span>
          <span>셀렉: {selector === 'customer' ? '고객' : '디렉터'}</span>
        </div>
      </Panel>
      <div className={styles.progressHeading}>
        <strong>진행 체크</strong>
        <span>{checks.length} / 8</span>
      </div>
      <progress className={styles.progress} max={8} value={checks.length} />
      <div className={styles.checklist}>
        {steps.map(([key, title, description]) => (
          <CheckItem
            key={key}
            className={styles.check}
            label={title}
            description={description}
            completed={checks.includes(key)}
            disabled={busy || !allowed}
            onClick={() => void toggle(key)}
            trailing={<Icon name="chevron" size={16} />}
          />
        ))}
      </div>
      <Panel className={styles.selector}>
        <h2>
          <Icon name="solar/user-check-bold" size={18} />
          셀렉 주체 최종 확인
        </h2>
        <p>
          설문 선택자: {shoot.survey?.answers.selector === 'director' ? '디렉터 셀렉' : '고객 셀렉'}{' '}
          · 현장에서 바뀌었다면 변경 후 사유를 남겨주세요.
        </p>
        <RadioPills
          label="확정 셀렉 주체"
          value={selector}
          disabled={busy || !allowed}
          onValueChange={(value) => setSelector(value as 'customer' | 'director')}
          options={[
            { value: 'customer', label: '고객 셀렉 유지' },
            { value: 'director', label: '디렉터 셀렉으로 변경' },
          ]}
        />
        <TextField
          label="변경 사유"
          placeholder="셀렉 주체 변경 사유"
          value={reason}
          onValueChange={setReason}
          disabled={busy || !allowed}
        />
        <TextField
          label="특이사항 메모"
          placeholder="특이사항 메모 (예: 안경 벗고 촬영)"
          value={note}
          onValueChange={setNote}
          disabled={busy || !allowed}
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={busy || !allowed}
          onClick={() => void save()}
        >
          현장 기록 저장
        </Button>
      </Panel>
      <div className={styles.sticky}>
        <Button
          disabled={busy || checks.length !== 8 || !shoot.capabilities.includes('complete_field')}
          loading={busy}
          onClick={finish}
        >
          촬영 완료 → 후보 사진 올리기
        </Button>
        <p>8개 항목 체크 후 활성화 · 다음 화면에서 후보 40~50장을 바로 올려요.</p>
      </div>
    </div>
  );
}
