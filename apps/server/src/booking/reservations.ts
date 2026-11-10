// 촬영의 실제 시간과 추가 점유 슬롯을 함께 사용해 디렉터 일정 충돌을 검사합니다.
import { koreaDate } from '@manspick/domain';
import { rows } from '../database/statements.ts';
import type { SqlValue } from '../database/statements.ts';
import type { Env } from '../runtime/env.ts';
import { reclaimableHold } from './holds.ts';

type Interval = { startsAt: string; endsAt: string };

export function occupiedInterval(interval: Interval, date: string, slots: string[]): Interval {
  const first = [...slots].sort()[0];
  const slotStart = first ? new Date(`${date}T${first}:00+09:00`).toISOString() : interval.startsAt;
  return {
    ...interval,
    startsAt: Date.parse(slotStart) < Date.parse(interval.startsAt) ? slotStart : interval.startsAt,
  };
}

// 이전 쇼핑 슬롯도 실제 업무가 시작되는 시간으로 취급합니다.
const occupiedStart = `min(julianday(s.starts_at),COALESCE((
  SELECT MIN(julianday(l.date||'T'||l.time||':00+09:00')) FROM slots l
  WHERE l.director_id=s.director_id AND l.date=date(s.starts_at,'+09:00') AND l.shoot_id=s.id
),julianday(s.starts_at)))`;

function intervalOverlap(interval: Interval) {
  return {
    sql: `${occupiedStart}<julianday(?) AND julianday(s.ends_at)>julianday(?)`,
    values: [interval.endsAt, interval.startsAt],
  };
}

export async function reservedIntervals(env: Env, interval: Interval, now: string) {
  const overlap = intervalOverlap(interval);
  return rows<{
    directorId: string;
    shootId: string;
    startsAt: string;
    endsAt: string;
    pending: number;
  }>(
    env,
    `SELECT s.director_id AS directorId,s.id AS shootId,
       strftime('%Y-%m-%dT%H:%M:%fZ',${occupiedStart}) AS startsAt,s.ends_at AS endsAt,
       EXISTS(SELECT 1 FROM payments p WHERE p.shoot_id=s.id AND p.kind='base' AND p.state='pending') AS pending
     FROM shoots s WHERE s.director_id IS NOT NULL AND s.status!='cancelled'
       AND ${overlap.sql} AND NOT ${reclaimableHold}`,
    ...overlap.values,
    now,
  );
}

export function conflictingReservations(
  directorId: string,
  date: string,
  slots: string[],
  interval: Interval | null,
  exceptShootId = '',
) {
  const clauses: string[] = [];
  const values: SqlValue[] = [exceptShootId];
  if (slots.length) {
    clauses.push(`s.id IN (SELECT l.shoot_id FROM slots l WHERE l.director_id=?
      AND l.date=? AND l.time IN (${slots.map(() => '?').join(',')}))`);
    values.push(directorId, date, ...slots);
  }
  if (interval) {
    const overlap = intervalOverlap(interval);
    clauses.push(`(s.director_id=? AND s.status!='cancelled' AND ${overlap.sql})`);
    values.push(directorId, ...overlap.values);
  }
  return {
    sql: `s.id!=? AND (${clauses.join(' OR ') || '0'})`,
    values,
  };
}

export function lastOccupiedDate(date: string, interval: Interval | null) {
  return interval ? koreaDate(new Date(Date.parse(interval.endsAt) - 1)) : date;
}
