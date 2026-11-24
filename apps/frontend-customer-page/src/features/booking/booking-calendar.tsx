// 서버가 제공한 예약 가능 날짜를 월별 달력으로 보여줍니다.
'use client';

import { useState } from 'react';
import { Button, DateCell } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import styles from './booking.module.css';

export type CalendarDay = { date: string; slots: { time: string; available: boolean }[] };

export function BookingCalendar({
  days,
  horizonWeeks,
  value,
  onValueChange,
}: {
  days: CalendarDay[];
  horizonWeeks: number;
  value: string;
  onValueChange: (value: string) => void;
}) {
  const months = [...new Set(days.map((day) => day.date.slice(0, 7)))];
  const [monthIndex, setMonthIndex] = useState(0);
  const month = months[Math.min(monthIndex, months.length - 1)];
  if (!month) return <p>예약 가능한 일정을 준비하고 있어요.</p>;
  const [year, monthNumber] = month.split('-').map(Number);
  const offset = new Date(year, monthNumber - 1, 1).getDay();
  const count = new Date(year, monthNumber, 0).getDate();
  return (
    <section className={styles.calendar} aria-label="촬영 날짜">
      <div className={styles.monthHeader}>
        <Button
          variant="ghost"
          size="sm"
          aria-label="이전 달"
          disabled={monthIndex === 0}
          onClick={() => setMonthIndex(monthIndex - 1)}
        >
          <Icon name="solar/alt-arrow-down-linear" size={18} />
        </Button>
        <h3 aria-live="polite">
          {year}년 {monthNumber}월
        </h3>
        <Button
          variant="ghost"
          size="sm"
          aria-label="다음 달"
          disabled={monthIndex >= months.length - 1}
          onClick={() => setMonthIndex(monthIndex + 1)}
        >
          <Icon name="solar/alt-arrow-down-linear" size={18} />
        </Button>
      </div>
      <div className={styles.dateGrid}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <span key={day} className={styles.weekday}>
            {day}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" />
        ))}
        {Array.from({ length: count }, (_, index) => {
          const day = index + 1;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const available =
            days.find((entry) => entry.date === date)?.slots.some((slot) => slot.available) ??
            false;
          return (
            <DateCell
              key={date}
              day={day}
              aria-label={`${year}년 ${monthNumber}월 ${day}일${available ? ' 예약 가능' : ' 마감'}`}
              selected={date === value}
              marker={available}
              disabled={!available}
              onClick={() => onValueChange(date)}
            />
          );
        })}
      </div>
      <p className={styles.legend}>
        <span>예약 가능</span> 흐린 날짜는 마감 · {horizonWeeks}주 앞까지 예약
      </p>
    </section>
  );
}
