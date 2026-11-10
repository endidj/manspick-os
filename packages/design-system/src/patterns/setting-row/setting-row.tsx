// 설정 이름·설명·현재 값·편집 동작을 나란히 배치하며 저장은 화면에서 처리합니다.
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './setting-row.module.css';

export type SettingRowProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  description?: ReactNode;
  value?: ReactNode;
  actions?: ReactNode;
  density?: 'default' | 'compact';
};

export function SettingRow({
  label,
  description,
  value,
  actions,
  density = 'default',
  className = '',
  ...props
}: SettingRowProps) {
  return (
    <div {...props} className={`${styles.row} ${className}`} data-density={density}>
      <div className={styles.content}>
        <strong className={styles.label}>{label}</strong>
        {description != null && <div className={styles.description}>{description}</div>}
      </div>
      {(value != null || actions != null) && (
        <div className={styles.trailing}>
          {value != null && <div className={styles.value}>{value}</div>}
          {actions != null && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
    </div>
  );
}
