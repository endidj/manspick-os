// 선택한 내용과 수정 동작을 요약하는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './summary-card.module.css';

export type SummaryCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  value: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function SummaryCard({
  label,
  value,
  description,
  action,
  className = '',
  ...props
}: SummaryCardProps) {
  return (
    <div {...props} className={`${styles.summary} ${className}`}>
      <div className={styles.summaryCopy}>
        <span className={styles.summaryLabel}>{label}</span>
        <strong className={styles.summaryValue}>{value}</strong>
        {description && <div className={styles.hint}>{description}</div>}
      </div>
      {action && <div className={styles.summaryAction}>{action}</div>}
    </div>
  );
}
