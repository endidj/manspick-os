// 예약 시간의 선택 가능 여부를 표시하는 공통 컴포넌트입니다.
import type { ButtonHTMLAttributes } from 'react';
import styles from './time-slot.module.css';

export type TimeSlotProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  selected?: boolean;
  availability?: 'available' | 'booked' | 'unavailable' | 'expired';
};

export function TimeSlot({
  label,
  selected = false,
  availability = 'available',
  className = '',
  disabled,
  ...props
}: TimeSlotProps) {
  const unavailable = availability !== 'available';
  const reason = { booked: '예약 완료', unavailable: '선택 불가', expired: '마감', available: '' }[
    availability
  ];
  return (
    <button
      {...props}
      type="button"
      className={`${styles.timeSlot} ${className}`}
      disabled={disabled || unavailable}
      aria-pressed={selected}
      aria-label={props['aria-label'] ?? `${label}${reason ? ` · ${reason}` : ''}`}
      data-selected={selected || undefined}
      data-contrast-exception={selected ? 'figma-blue500' : undefined}
      data-unavailable={unavailable || undefined}
    >
      {label}
    </button>
  );
}
