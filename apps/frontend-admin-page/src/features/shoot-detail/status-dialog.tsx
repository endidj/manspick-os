// 상태를 일곱 단계로 묶어 보여주고 변경 사유와 취소를 서버에 저장합니다.
import { useState } from 'react';
import { STATUSES, STAGE_LABELS, type ShootStatus } from '@manspick/domain';
import { Button, StageBadge } from '@manspick/design-system/components';
import { Dialog, TextArea } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

export function StatusDialog({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<ShootStatus>(shoot.status);
  const [reason, setReason] = useState('');

  async function save() {
    if (
      await perform(
        target === 'cancelled'
          ? { type: 'cancel', reason }
          : { type: 'change_status', status: target, reason },
      )
    )
      setOpen(false);
  }

  return (
    <>
      <Button
        variant="secondary"
        disabled={busy || !shoot.capabilities.includes('change_status')}
        onClick={() => {
          setTarget(shoot.status);
          setOpen(true);
        }}
      >
        상태 변경 ▾
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`상태 변경 · ${shoot.customerName}`}
        description="내부 상태 30개 + 취소 · 고객에게는 7단계만 보입니다"
        className={styles.statusDialog}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              취소
            </Button>
            <Button
              loading={busy}
              disabled={target === shoot.status || (target === 'cancelled' && !reason.trim())}
              onClick={save}
            >
              {target === 'cancelled' ? '취소' : STATUSES.find((s) => s.id === target)?.label}로
              변경
            </Button>
          </>
        }
      >
        <div className={styles.statusGroups}>
          {STAGE_LABELS.map((label, index) => (
            <div className={styles.statusGroup} key={label}>
              <StageBadge stage={(index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7} label={label} />
              <div>
                {STATUSES.filter((s) => s.stage === index + 1).map((status) => (
                  <button
                    type="button"
                    key={status.id}
                    data-active={target === status.id}
                    aria-pressed={target === status.id}
                    disabled={busy}
                    onClick={() => setTarget(status.id)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {shoot.capabilities.includes('cancel') && (
            <div className={styles.statusGroup}>
              <span>취소 · 별도</span>
              <div>
                <button
                  type="button"
                  data-danger
                  data-active={target === 'cancelled'}
                  aria-pressed={target === 'cancelled'}
                  onClick={() => setTarget('cancelled')}
                >
                  취소 (사유 필수 · 보드에서 숨김)
                </button>
              </div>
            </div>
          )}
        </div>
        <TextArea
          label="변경 사유 (단계 건너뛰기 · 되돌리기 시 필수)"
          placeholder="예: 고객 요청으로 진행 단계 변경"
          value={reason}
          onValueChange={setReason}
          disabled={busy}
        />
        <p className={styles.caption}>
          변경 내역은 타임라인에 기록됩니다. 셀렉 공개와 보정 전달은 해당 업무 화면에서 처리합니다.
        </p>
      </Dialog>
    </>
  );
}
