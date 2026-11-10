// 운영자에게 주간 디렉터 일정과 최근 배정 내역을 보여줍니다.
import { datePlusDays, DomainError, SLOT_TIMES } from '@manspick/domain';
import type { Actor, ScheduleDTO } from '@manspick/contracts';
import { reclaimableHold } from '../booking/holds.ts';
import { reservedIntervals } from '../booking/reservations.ts';
import { rows } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { operator } from '../security/permissions.ts';
import { listShoots } from './queries.ts';

export async function schedule(env: Env, actor: Actor, week: string): Promise<ScheduleDTO> {
  operator(actor);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(week) ||
    Number.isNaN(Date.parse(week)) ||
    new Date(week).toISOString().slice(0, 10) !== week
  )
    throw new DomainError('INVALID_DATE', '주간 시작 날짜를 확인해주세요.');
  const end = datePlusDays(week, 6);
  const now = new Date().toISOString();
  const [directors, locks, off, list, occupied] = await Promise.all([
    rows<{ id: string; name: string }>(
      env,
      "SELECT id,name FROM staff WHERE role='director' AND active=1 ORDER BY id",
    ),
    rows<{ directorId: string; date: string; time: string; shootId: string; pending: number }>(
      env,
      `SELECT l.director_id AS directorId,l.date,l.time,l.shoot_id AS shootId,
        EXISTS(SELECT 1 FROM payments p WHERE p.shoot_id=l.shoot_id AND p.kind='base' AND p.state='pending') AS pending
       FROM slots l JOIN shoots s ON s.id=l.shoot_id WHERE l.date>=? AND l.date<=? AND NOT ${reclaimableHold}`,
      week,
      end,
      now,
    ),
    rows<{ directorId: string; date: string }>(
      env,
      'SELECT director_id AS directorId,date FROM director_days_off WHERE date>=? AND date<=?',
      week,
      end,
    ),
    listShoots(env, actor, false, { assignedOnly: true }),
    reservedIntervals(
      env,
      {
        startsAt: `${week}T00:00:00+09:00`,
        endsAt: `${datePlusDays(end, 1)}T00:00:00+09:00`,
      },
      now,
    ),
  ]);
  const slots: ScheduleDTO['slots'] = directors.flatMap((person) =>
    Array.from({ length: 7 }, (_, i) => datePlusDays(week, i)).flatMap((date) =>
      SLOT_TIMES.map((time) => {
        const slotStart = Date.parse(`${date}T${time}:00+09:00`);
        const lock =
          locks.find(
            (item) => item.directorId === person.id && item.date === date && item.time === time,
          ) ??
          occupied.find(
            (item) =>
              item.directorId === person.id &&
              Date.parse(item.startsAt) <= slotStart &&
              slotStart < Date.parse(item.endsAt),
          );
        return {
          directorId: person.id,
          date,
          time,
          state: lock
            ? lock.pending
              ? ('held' as const)
              : ('reserved' as const)
            : off.some((item) => item.directorId === person.id && item.date === date)
              ? ('unavailable' as const)
              : ('available' as const),
          ...(lock ? { shootId: lock.shootId } : {}),
        };
      }),
    ),
  );
  return {
    directors,
    retouchers: await rows<{ id: string; name: string }>(
      env,
      "SELECT id,name FROM staff WHERE role='retoucher' AND active=1 ORDER BY id",
    ),
    slots,
    recentAssignments: list.shoots.slice(0, 20),
  };
}
