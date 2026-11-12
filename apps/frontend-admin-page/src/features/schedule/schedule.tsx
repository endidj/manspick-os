// 실제 디렉터 배정 결과와 주간 시간표를 원본의 좌우 패널에 표시합니다.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { datePlusDays, koreaDate, SLOT_TIMES } from '@manspick/domain';
import type { StaffRole } from '@manspick/domain';
import {
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
  StageBadge,
} from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import type { ScheduleDTO, ShootSummary } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { dateTime } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import { useShootDetail } from '../shoot-detail/use-shoot-detail';
import { AssignmentDialog } from '../shoot-detail/assignment-dialog';
import { shootHref } from '../workspace/model';
import styles from './schedule.module.css';

export function Schedule({ role = 'staff' }: { shoots?: ShootSummary[]; role?: StaffRole }) {
  const [week, setWeek] = useState(koreaDate());
  const [data, setData] = useState<ScheduleDTO>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string>();
  const [holiday, setHoliday] = useState(false);
  const [date, setDate] = useState('');
  const [director, setDirector] = useState('');
  const [unavailable, setUnavailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api<ScheduleDTO>(`/schedule?week=${week}`)
      .then((value) => {
        if (active) {
          setData(value);
          setError('');
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      });
    return () => {
      active = false;
    };
  }, [week, revision]);
  const current =
    data?.recentAssignments.find((s) => s.id === selected) ?? data?.recentAssignments[0];
  const days = [...new Set(data?.slots.map((slot) => slot.date) ?? [])].sort();

  async function saveHoliday() {
    setBusy(true);
    setError('');
    try {
      await api('/settings', {
        method: 'POST',
        body: JSON.stringify({ type: 'day_off', directorId: director, date, unavailable }),
      });
      setHoliday(false);
      setRevision((value) => value + 1);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-3 / 2-4"
        title="디렉터 배정 · 스케줄"
        description="고객이 일정을 고르는 순간 자동 배정 · 즉시 확정 → 필요할 때만 수동 변경 (사유 필수)"
        actions={
          role === 'admin' && <Button onClick={() => setHoliday(true)}>휴무 · 불가 등록</Button>
        }
      />
      {error && (
        <Notice tone="error">
          {error}
          <Button size="sm" variant="ghost" onClick={() => setRevision((value) => value + 1)}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {!data ? (
        !error && <Loading />
      ) : (
        <div className={styles.layout}>
          <aside>
            <h2 className={styles.listTitle}>최근 자동 배정 {data.recentAssignments.length}</h2>
            <div className={styles.assignments}>
              {data.recentAssignments.slice(0, 12).map((shoot) => (
                <button
                  type="button"
                  key={shoot.id}
                  data-active={current?.id === shoot.id}
                  onClick={() => setSelected(shoot.id)}
                >
                  <div>
                    <strong>{shoot.customerName}</strong>
                    <StageBadge
                      stage={Math.max(1, shoot.stage) as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                      label={shoot.stage === 2 ? '일정·결제' : shoot.statusLabel}
                    />
                  </div>
                  <span>{shoot.packageName}</span>
                  <span>
                    {dateTime(shoot.startsAt)} · {shoot.statusLabel}
                  </span>
                </button>
              ))}
            </div>
          </aside>
          <div className={styles.screen}>
            {current ? (
              <AssignmentResult key={current.id} id={current.id} role={role} />
            ) : (
              <EmptyState title="최근 배정된 촬영이 없습니다" />
            )}
            <Panel className={styles.week}>
              <div className={styles.weekHeading}>
                <h2>
                  <Icon name="calendar" size={18} />
                  주간 스케줄 · {days[0]} – {days.at(-1)} · 11 · 13 · 15 · 17시
                </h2>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="이전 주"
                    onClick={() => setWeek(datePlusDays(week, -7))}
                  >
                    ◀
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setWeek(koreaDate())}>
                    이번 주
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="다음 주"
                    onClick={() => setWeek(datePlusDays(week, 7))}
                  >
                    ▶
                  </Button>
                </div>
              </div>
              <div className={styles.legend}>
                {[
                  ['available', '가능'],
                  ['reserved', '예약'],
                  ['unavailable', '불가 · 휴무'],
                  ['held', '잠금 (결제 대기)'],
                ].map(([state, label]) => (
                  <span key={state}>
                    <i data-state={state} />
                    {label}
                  </span>
                ))}
              </div>
              <div className={styles.matrixWrap}>
                <div
                  className={styles.matrix}
                  style={{ gridTemplateColumns: `80px repeat(${days.length},minmax(90px,1fr))` }}
                >
                  <div />
                  {days.map((day) => (
                    <div className={styles.dayLabel} key={day}>
                      {new Intl.DateTimeFormat('ko-KR', {
                        weekday: 'short',
                        month: 'numeric',
                        day: 'numeric',
                        timeZone: 'Asia/Seoul',
                      }).format(new Date(`${day}T12:00:00+09:00`))}
                    </div>
                  ))}
                  {data.directors.map((person) => (
                    <div className={styles.directorRow} key={person.id}>
                      <div className={styles.director}>
                        <strong>{person.name}</strong>
                        <span>
                          이번 주{' '}
                          {
                            new Set(
                              data.slots
                                .filter((s) => s.directorId === person.id && s.shootId)
                                .map((s) => s.shootId),
                            ).size
                          }
                          건
                        </span>
                      </div>
                      {days.map((day) => (
                        <div className={styles.daySlots} key={day}>
                          {SLOT_TIMES.map((time) => {
                            const slot = data.slots.find(
                              (s) =>
                                s.directorId === person.id && s.date === day && s.time === time,
                            );
                            const label =
                              slot?.state === 'held'
                                ? '잠금'
                                : slot?.state === 'reserved'
                                  ? '예약'
                                  : slot?.state === 'available'
                                    ? '가능'
                                    : '불가';
                            return slot?.shootId ? (
                              <Link
                                key={time}
                                href={shootHref(slot.shootId)}
                                className={styles.slot}
                                data-state={slot.state}
                              >
                                <span>{time}</span>
                                <span>{label}</span>
                              </Link>
                            ) : (
                              <div
                                key={time}
                                className={styles.slot}
                                data-state={slot?.state ?? 'unavailable'}
                              >
                                <span>{time}</span>
                                <span>{label}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
      <Dialog
        open={holiday}
        onOpenChange={setHoliday}
        title="디렉터 휴무 · 불가 등록"
        actions={
          <Button loading={busy} disabled={!date || !director} onClick={saveHoliday}>
            일정 저장
          </Button>
        }
      >
        <div className={styles.screen}>
          <label>
            디렉터
            <select value={director} onChange={(e) => setDirector(e.target.value)}>
              <option value="">선택해주세요</option>
              {data?.directors.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <TextField label="날짜" type="date" value={date} onValueChange={setDate} />
          <label>
            <input
              type="checkbox"
              checked={unavailable}
              onChange={(e) => setUnavailable(e.target.checked)}
            />{' '}
            휴무·예약 불가 (해제하려면 체크를 끕니다)
          </label>
        </div>
      </Dialog>
    </div>
  );
}

function AssignmentResult({ id, role }: { id: string; role: StaffRole }) {
  const { shoot, busy, error, perform } = useShootDetail(id);
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!shoot) return <Loading />;
  return (
    <Panel className={styles.result}>
      <div className={styles.weekHeading}>
        <h2>
          <Icon name="solar/user-check-bold" size={18} />
          {shoot.customerName} · 자동 배정 결과
        </h2>
        <span>{dateTime(shoot.startsAt)}</span>
      </div>
      <div className={styles.steps}>
        <span>1. 난이도</span> → <span>2. 가능 일정</span> → <span>3. 업무량 균등</span>
      </div>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>디렉터</th>
              <th>1. 스킬</th>
              <th>2. 고른 시간</th>
              <th>3. 이번 주 업무량</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {shoot.assignmentCandidates.map((candidate) => (
              <tr
                key={candidate.directorId}
                data-selected={candidate.directorId === shoot.directorId}
              >
                <th>{candidate.name}</th>
                <td>{candidate.skillEligible ? '✓ 가능' : '× 부가서비스 불가'}</td>
                <td>{candidate.available ? '✓ 비어 있음' : '예약 불가'}</td>
                <td>{candidate.weeklyLoad}건</td>
                <td>{candidate.directorId === shoot.directorId ? '배정됨' : candidate.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.resultActions}>
        <p>
          배정 근거는 타임라인에 기록됩니다. 수동 변경 시 사유 입력 필수 · 올데이는 그날 4타임을
          모두 비워야 배정됩니다.
        </p>
        {['admin', 'staff'].includes(role) && (
          <AssignmentDialog shoot={shoot} busy={busy} perform={perform} />
        )}
        <Link href={shootHref(shoot.id)} className={styles.primaryLink}>
          고객 상세 열기
        </Link>
      </div>
    </Panel>
  );
}
