// 진행 제목과 전체 단계 대비 위치를 보여주는 공통 컴포넌트입니다.
import type { HTMLAttributes } from 'react';
import styles from './step-header.module.css';

export type StepHeaderProps = HTMLAttributes<HTMLElement> & {
  title: string;
  current: number;
  total?: number;
};

export function StepHeader({
  title,
  current,
  total = 7,
  className = '',
  ...props
}: StepHeaderProps) {
  const maximum = Math.max(1, total);
  const value = Math.max(0, Math.min(maximum, current));
  return (
    <header {...props} className={`${styles.stepHeader} ${className}`}>
      <div className={styles.stepHeading}>
        <span>{title}</span>
        <span>
          {value} / {maximum}
        </span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={maximum}
        aria-valuenow={value}
      >
        <span style={{ width: `${(value / maximum) * 100}%` }} />
      </div>
    </header>
  );
}
