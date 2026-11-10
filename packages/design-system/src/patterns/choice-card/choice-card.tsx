// 설명과 아이콘을 갖춘 선택 항목을 그리는 공통 컴포넌트입니다.
'use client';

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import styles from './choice-card.module.css';

export type ChoiceCardProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'title' | 'checked' | 'defaultChecked' | 'onChange' | 'children'
> & {
  title: string;
  description?: ReactNode;
  leadingIcon?: ReactNode;
  type?: 'radio' | 'checkbox';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function ChoiceCard({
  title,
  description,
  leadingIcon,
  type = 'radio',
  checked,
  onCheckedChange,
  className = '',
  id,
  'aria-describedby': describedBy,
  ...props
}: ChoiceCardProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  return (
    <label
      htmlFor={fieldId}
      className={`${styles.choice} ${className}`}
      data-checked={checked || undefined}
    >
      <input
        {...props}
        className={leadingIcon ? styles.visuallyHidden : undefined}
        id={fieldId}
        type={type}
        checked={checked}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
        aria-describedby={[describedBy, descriptionId].filter(Boolean).join(' ') || undefined}
      />
      {leadingIcon && (
        <span className={styles.choiceIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <span className={styles.choiceCopy}>
        <span className={styles.choiceTitle}>{title}</span>
        {description && (
          <span id={descriptionId} className={styles.hint}>
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
