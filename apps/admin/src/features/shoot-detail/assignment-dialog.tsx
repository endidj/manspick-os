// 현재 스킬과 일정에 맞는 담당자를 선택하고 변경 사유를 저장합니다.
import { useEffect, useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import { Dialog, TextArea } from '@manspick/design-system/patterns';
import type { ScheduleDTO, ShootDetail } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

export function AssignmentDialog({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
}) {
  const [open, setOpen] = useState(false);
  const [director, setDirector] = useState(shoot.directorId ?? '');
  const [retoucher, setRetoucher] = useState(shoot.retoucherId ?? '');
  const [reason, setReason] = useState('');
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open)
      api<ScheduleDTO & { retouchers?: { id: string; name: string }[] }>('/schedule')
        .then((data) => setStaff(data.retouchers ?? []))
        .catch((cause) => setError(cause.message));
  }, [open]);

  async function save() {
    if (
      await perform({
        type: 'assign_staff',
        ...(director ? { directorId: director } : {}),
        ...(retoucher ? { retoucherId: retoucher } : {}),
        reason,
      })
    )
      setOpen(false);
  }

  return (
    <>
      <Button
        variant="secondary"
        disabled={busy || !shoot.capabilities.includes('assign_staff')}
        onClick={() => setOpen(true)}
      >
        담당자 변경
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="담당자 변경"
        description="스킬·일정 확인 후 변경 사유를 기록합니다."
        actions={
          <Button disabled={!reason.trim() || busy} loading={busy} onClick={save}>
            담당자 변경
          </Button>
        }
      >
        <div className={styles.stackSmall}>
          {error && <Notice tone="error">{error}</Notice>}
          <label className={styles.selectField}>
            디렉터
            <select value={director} onChange={(e) => setDirector(e.target.value)}>
              <option value="">변경하지 않음</option>
              {shoot.assignmentCandidates.map((candidate) => (
                <option
                  key={candidate.directorId}
                  value={candidate.directorId}
                  disabled={!candidate.skillEligible || !candidate.available}
                >
                  {candidate.name} · 주 {candidate.weeklyLoad}건
                  {!candidate.skillEligible
                    ? ' · 스킬 불가'
                    : !candidate.available
                      ? ' · 일정 불가'
                      : ''}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.selectField}>
            보정가
            <select value={retoucher} onChange={(e) => setRetoucher(e.target.value)}>
              <option value="">변경하지 않음</option>
              {staff.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
              {shoot.retoucherId && !staff.some((s) => s.id === shoot.retoucherId) && (
                <option value={shoot.retoucherId}>{shoot.retoucherName}</option>
              )}
            </select>
          </label>
          <TextArea label="변경 사유" value={reason} onValueChange={setReason} required />
        </div>
      </Dialog>
    </>
  );
}
