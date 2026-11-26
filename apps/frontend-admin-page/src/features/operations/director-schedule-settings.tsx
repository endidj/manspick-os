// 자동 배정에 사용할 입사일과 한국 시각 기준 근무 가능 구간을 관리합니다.
import { useState } from 'react';
import type { OperationsSettingsDTO, SettingsAction } from '@manspick/contracts';
import { Button, Panel } from '@manspick/design-system/components';
import { TextField } from '@manspick/design-system/patterns';
import { dateTime } from '@manspick/web/format';

export function DirectorScheduleSettings({
  data,
  directorId,
  busy,
  save,
}: {
  data: OperationsSettingsDTO;
  directorId: string;
  busy: boolean;
  save: (action: SettingsAction) => Promise<boolean>;
}) {
  const [hired, setHired] = useState(data.staff.find((s) => s.id === directorId)?.hiredOn ?? '');
  const [windows, setWindows] = useState(
    (data.directorAvailability ?? [])
      .filter((w) => w.directorId === directorId)
      .map(({ startsAt, endsAt }) => ({ startsAt, endsAt })),
  );
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  return (
    <Panel>
      <h2>입사일과 근무 시간</h2>
      <TextField label="입사일" type="date" value={hired} onValueChange={setHired} />
      <p>
        근무 구간을 등록하면 해당 구간 안에서 일정을 배정합니다. 구간이 비어 있으면 기본 영업시간과
        휴무일을 적용합니다.
      </p>
      {windows.map((w, i) => (
        <div key={w.startsAt}>
          {dateTime(w.startsAt)} – {dateTime(w.endsAt)}{' '}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setWindows(windows.filter((_, n) => n !== i))}
          >
            제거
          </Button>
        </div>
      ))}
      <TextField
        label="근무 시작 (한국 시각)"
        type="datetime-local"
        value={start}
        onValueChange={setStart}
      />
      <TextField
        label="근무 종료 (한국 시각)"
        type="datetime-local"
        value={end}
        onValueChange={setEnd}
      />
      <Button
        variant="secondary"
        disabled={!start || !end || end <= start}
        onClick={() => {
          setWindows([
            ...windows,
            {
              startsAt: new Date(start + ':00+09:00').toISOString(),
              endsAt: new Date(end + ':00+09:00').toISOString(),
            },
          ]);
          setStart('');
          setEnd('');
        }}
      >
        근무 구간 추가
      </Button>
      <Button
        loading={busy}
        disabled={!directorId}
        onClick={() =>
          void save({ type: 'director_schedule', directorId, hiredOn: hired || null, windows })
        }
      >
        배정 기준 저장
      </Button>
    </Panel>
  );
}
