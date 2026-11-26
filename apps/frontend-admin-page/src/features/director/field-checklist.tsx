// 현장 촬영 체크리스트와 메모를 저장하고 촬영 완료를 기록합니다.
import { useState } from 'react';
import { Button, CheckItem, Panel, StageBadge } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { TextField } from '@manspick/design-system/patterns';
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
  ['closing', '마무리 안내', '촬영 진행을 정리하고 고객에게 마무리 안내'],
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
  const [note, setNote] = useState(shoot.fieldMemo);
  const finished = Boolean(shoot.fieldChecklist.completedAt);
  const allowed = shoot.capabilities.includes('save_field_checklist') && !finished;

  async function save(next = checks) {
    return perform({ type: 'save_field_checklist', checks: next, note });
  }

  async function toggle(key: string) {
    const next = checks.includes(key) ? checks.filter((item) => item !== key) : [...checks, key];
    if (await save(next)) setChecks(next);
  }

  async function finish() {
    if ((await save()) && (await perform({ type: 'complete_field' })))
      window.location.assign(shootHref(shoot.id, 'manage'));
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
        <h2>현장 기록</h2>
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
          촬영 완료
        </Button>
        <p>8개 항목을 확인하면 촬영을 완료할 수 있어요.</p>
      </div>
    </div>
  );
}
