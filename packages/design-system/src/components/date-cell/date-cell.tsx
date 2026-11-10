// 날짜 한 칸의 선택 상태를 표시하는 공통 컴포넌트입니다.
import type { ButtonHTMLAttributes } from 'react';
import styles from './date-cell.module.css';

export type DateCellProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  day: number | string;
  selected?: boolean;
  today?: boolean;
  marker?: boolean;
};

export function DateCell({
  day,
  selected = false,
  today = false,
  marker = false,
  className = '',
  ...props
}: DateCellProps) {
  return (
    <button
      {...props}
      type="button"
      aria-label={props['aria-label'] ? `${day} · ${props['aria-label']}` : undefined}
      className={`${styles.dateCell} ${className}`}
      aria-pressed={selected}
      aria-current={today ? 'date' : undefined}
      data-selected={selected || undefined}
      data-contrast-exception={selected ? 'figma-blue500' : undefined}
    >
      <span>{day}</span>
      {(marker || today) && <span className={styles.dateMarker} aria-hidden="true" />}
    </button>
  );
}
