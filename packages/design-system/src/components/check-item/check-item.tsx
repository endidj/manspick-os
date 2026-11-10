// 준비 항목의 완료 상태를 표시하는 공통 컴포넌트입니다.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './check-item.module.css';

export type CheckItemProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  description?: string;
  completed?: boolean;
  trailing?: ReactNode;
};

export function CheckItem({
  label,
  description,
  completed = false,
  trailing,
  className = '',
  ...props
}: CheckItemProps) {
  return (
    <button
      {...props}
      type="button"
      className={`${styles.checkItem} ${className}`}
      aria-pressed={completed}
    >
      <span className={styles.checkCircle} data-completed={completed || undefined}>
        {completed && <Icon name="check" size={18} />}
      </span>
      <span className={styles.checkCopy}>
        <span className={styles.checkLabel} data-completed={completed || undefined}>
          {label}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {trailing ?? <Icon name="chevron" size={20} />}
    </button>
  );
}
