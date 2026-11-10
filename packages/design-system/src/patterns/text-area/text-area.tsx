// 여러 줄 입력과 도움말·오류를 연결하는 공통 컴포넌트입니다.
'use client';

import { useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import styles from './text-area.module.css';

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange'
> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  value: string;
  onValueChange: (value: string) => void;
};

export function TextArea({
  label,
  hint,
  error,
  value,
  onValueChange,
  id,
  required,
  className = '',
  'aria-describedby': describedBy,
  ...props
}: TextAreaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionIds =
    [describedBy, hint ? `${fieldId}-hint` : undefined, error ? `${fieldId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <textarea
        {...props}
        id={fieldId}
        required={required}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        aria-describedby={descriptionIds}
        aria-invalid={error ? true : props['aria-invalid']}
        className={`${styles.textarea} ${className}`}
      />
      {hint && (
        <div id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </div>
      )}
      {error && (
        <p id={`${fieldId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
