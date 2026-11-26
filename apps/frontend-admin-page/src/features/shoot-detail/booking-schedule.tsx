// 예약에 제출된 후보를 보여주고 담당 디렉터가 촬영 일시와 장소를 확정합니다.
import { useState } from 'react';
import type { ShootDetail } from '@manspick/contracts';
import { Button, Panel } from '@manspick/design-system/components';
import { SelectField, TextField, InfoRow } from '@manspick/design-system/patterns';
import { dateTime } from '@manspick/web/format';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

export function BookingSchedule({
  shoot,
  busy,
  perform,
}: {
  shoot: ShootDetail;
  busy?: boolean;
  perform?: PerformAction;
}) {
  const options = shoot.timeOptions ?? [];
  const confirmed = shoot.confirmedSchedule;
  const [optionId, setOptionId] = useState('');
  const [location, setLocation] = useState('');
  const [editingOptionId, setEditingOptionId] = useState<string>();
  const editable = perform && shoot.capabilities.includes('confirm_schedule') && options.length > 0;
  const selected = options.find((option) => option.id === confirmed?.optionId);
  return (
    <Panel className={styles.stackSmall}>
      <h2>예약 일정</h2>
      <InfoRow
        label="확정 일정"
        value={
          selected
            ? `${selected.date} ${selected.time}`
            : !options.length && shoot.startsAt
              ? dateTime(shoot.startsAt)
              : '일정 확정 전'
        }
      />
      <InfoRow
        label="촬영 장소"
        value={confirmed?.location || shoot.preparation?.location.meetingPlace || '미정'}
      />
      {options.length > 0 && (
        <>
          <h3>고객 희망 일정</h3>
          <ul>
            {options.map((option) => (
              <li key={option.id}>
                {option.date} {option.time}
              </li>
            ))}
          </ul>
        </>
      )}
      {editable && confirmed && !editingOptionId && (
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setOptionId(confirmed.optionId);
            setLocation(confirmed.location);
            setEditingOptionId(confirmed.optionId);
          }}
        >
          일정 변경
        </Button>
      )}
      {editable && (!confirmed || editingOptionId) && (
        <form
          className={styles.stackSmall}
          onSubmit={async (event) => {
            event.preventDefault();
            if (
              !busy &&
              optionId &&
              location.trim() &&
              (await perform({
                type: 'confirm_schedule',
                optionId,
                location: location.trim(),
                ...(editingOptionId && { previousOptionId: editingOptionId }),
              }))
            )
              setEditingOptionId(undefined);
          }}
        >
          <SelectField
            label="확정할 희망 일정"
            value={optionId}
            onValueChange={setOptionId}
            disabled={busy}
            options={[
              { value: '', label: '희망 일정을 선택하세요' },
              ...options.map((option) => ({
                value: option.id,
                label: `${option.date} ${option.time}`,
              })),
            ]}
          />
          <TextField
            label="확정 촬영 장소"
            value={location}
            onValueChange={setLocation}
            required
            disabled={busy}
          />
          <Button
            type="submit"
            loading={busy}
            disabled={
              !optionId ||
              !location.trim() ||
              (confirmed != null &&
                optionId === confirmed.optionId &&
                location.trim() === confirmed.location)
            }
          >
            {confirmed ? '변경한 일정 저장' : '일정과 장소 확정'}
          </Button>
          {editingOptionId && (
            <Button variant="ghost" disabled={busy} onClick={() => setEditingOptionId(undefined)}>
              변경 취소
            </Button>
          )}
        </form>
      )}
    </Panel>
  );
}
