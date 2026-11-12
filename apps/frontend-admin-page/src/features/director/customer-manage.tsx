// 디렉터가 고객 설계와 장소를 편집하고 당일 체크리스트로 이동하게 합니다.
import Link from 'next/link';
import { useState } from 'react';
import { STAGE_LABELS } from '@manspick/domain';
import { Button, Panel, StageBadge } from '@manspick/design-system/components';
import { Dialog, TextArea } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import { PlanEditor } from '../shoot-detail/overview';
import { PreparationEditor } from '../shoot-detail/preparation-editor';
import { ShootMessages } from '../shoot-detail/messages';
import type { PerformAction } from '../shoot-detail/use-shoot-detail';
import { shootHref } from '../workspace/model';
import { MobileHeader } from './mobile-header';
import styles from './director.module.css';

function answer(value: unknown) {
  return Array.isArray(value) ? value.join(' · ') : String(value ?? '미입력');
}

export function CustomerManage({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [editor, setEditor] = useState(false);
  const [note, setNote] = useState('');
  const answers = shoot.survey?.answers ?? {};
  return (
    <div className={styles.mobile}>
      <MobileHeader
        title={shoot.customerName}
        subtitle="DIRECTOR · 3-2 · 고객 관리"
        back="/?view=my-customers"
      />
      <Panel className={styles.summary}>
        <div className={styles.cardTop}>
          <h1>{dateTime(shoot.startsAt)}</h1>
          <StageBadge
            stage={Math.max(1, shoot.stage) as 1 | 2 | 3 | 4 | 5 | 6 | 7}
            label={STAGE_LABELS[Math.max(0, shoot.stage - 1)]!}
          />
        </div>
        <p>
          {shoot.packageName}
          {shoot.addons.map((a) => ` + ${a.name}`).join('')} ·{' '}
          {shoot.preparation?.location.area ?? '동네 미정'} · {shoot.package.duration}분
        </p>
        <div className={styles.facts}>
          {[
            ['목적', answer(answers.purposes)],
            ['무드', answer(answers.style)],
            ['고민', answer(answers.concerns)],
            [
              '의상',
              `${shoot.package.outfits}벌 · 의상 사진 ${shoot.uploads.filter((u) => u.kind === 'outfit').length}/${shoot.outfitPhotosRequired}`,
            ],
            ['셀렉', shoot.selectionMode === 'director' ? '디렉터 셀렉' : '고객 셀렉'],
          ].map(([label, value]) => (
            <div className={styles.fact} key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </Panel>
      <h2 className={styles.sectionTitle}>
        촬영 설계
        <span>
          {shoot.plan?.sharedAt ? `고객 공개 ${dateTime(shoot.plan.sharedAt)} ✓` : '고객 공개 전'}
        </span>
      </h2>
      <Panel className={styles.planCard}>
        <h2>
          컨셉 · 촬영 동네
          <span>
            {shoot.preparation?.location.area} · {shoot.preparation?.location.meetingPlace}
          </span>
        </h2>
        <p className={styles.planText}>
          {shoot.plan?.concept || '고객에게 공유할 촬영 컨셉을 작성해주세요.'}
        </p>
        <div className={styles.row}>
          <Button
            size="sm"
            disabled={busy || !shoot.capabilities.includes('share_plan')}
            onClick={() => setEditor(true)}
          >
            수정
          </Button>
          {shoot.plan?.sharedAt && <span>✓ 고객 공개됨</span>}
        </div>
        <PreparationEditor shoot={shoot} busy={busy} perform={perform} />
      </Panel>
      <Panel className={styles.planCard}>
        <h2>
          벌별 코디 제안<span>참고 사진 {shoot.plan?.referenceImages.length ?? 0}장</span>
        </h2>
        <p className={styles.planText}>
          {shoot.plan?.outfits || '의상별 코디 제안을 작성해주세요.'}
        </p>
        <div className={styles.row}>
          <Button
            size="sm"
            disabled={busy || !shoot.capabilities.includes('share_plan')}
            onClick={() => setEditor(true)}
          >
            코디 · 참고 사진 편집
          </Button>
          {shoot.plan?.sharedAt && <span>✓ 고객 공개됨</span>}
        </div>
      </Panel>
      <ShootMessages shootId={shoot.id} role="director" />
      <Panel className={styles.summary}>
        <h2>카카오 응대 메모</h2>
        {shoot.notes.slice(0, 2).map((entry) => (
          <p key={entry.id}>{entry.text}</p>
        ))}
        <TextArea
          label="내부 메모"
          value={note}
          onValueChange={setNote}
          placeholder="고객 응대 메모를 남겨주세요"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!note.trim() || busy || !shoot.capabilities.includes('note')}
          onClick={async () => {
            if (await perform({ type: 'note', text: note })) setNote('');
          }}
        >
          메모 저장
        </Button>
      </Panel>
      <div className={styles.sticky}>
        <Link className={styles.primaryLink} href={shootHref(shoot.id, 'field')}>
          촬영 당일 체크리스트 시작
        </Link>
        <Link className={styles.secondaryLink} href={shootHref(shoot.id, 'candidates')}>
          {shoot.selectionMode === 'director' &&
          shoot.selections.some((selection) => selection.round === 'base')
            ? '최종 셀렉 확인'
            : shoot.selectionMode === 'director' && shoot.status === 'selection_pending'
              ? '디렉터 최종 셀렉 진행'
              : '후보 사진 올리기'}
        </Link>
        <p>외부 카카오 채널 주소는 운영 설정 후 연결됩니다.</p>
      </div>
      <Dialog open={editor} onOpenChange={setEditor} title="촬영 설계 편집">
        <PlanEditor shoot={shoot} busy={busy} perform={perform} />
      </Dialog>
    </div>
  );
}
