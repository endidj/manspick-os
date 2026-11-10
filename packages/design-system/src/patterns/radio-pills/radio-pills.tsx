// 여러 선택지 중 하나를 고르게 하는 공통 컴포넌트입니다.
'use client';

import { useId, type ReactNode } from 'react';
import styles from './radio-pills.module.css';

export type RadioPillOption = { value: string; label: ReactNode; disabled?: boolean };
export type RadioPillsProps = {
  label: string;
  options: readonly RadioPillOption[];
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

export function RadioPills({
  label,
  options,
  value,
  onValueChange,
  name,
  hint,
  error,
  required,
  disabled,
  className = '',
}: RadioPillsProps) {
  const groupId = useId();
  const descriptionIds =
    [hint ? `${groupId}-hint` : undefined, error ? `${groupId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <fieldset
      className={`${styles.fieldset} ${className}`}
      disabled={disabled}
      aria-describedby={descriptionIds}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </legend>
      <div className={styles.pills}>
        {options.map((option) => (
          <label key={option.value} className={styles.pill}>
            <input
              className={styles.visuallyHidden}
              type="radio"
              name={name ?? groupId}
              value={option.value}
              checked={value === option.value}
              required={required}
              disabled={disabled || option.disabled}
              onChange={() => onValueChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {hint && (
        <div id={`${groupId}-hint`} className={`${styles.hint} ${styles.groupHint}`}>
          {hint}
        </div>
      )}
      {error && (
        <p id={`${groupId}-error`} className={`${styles.error} ${styles.groupHint}`} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
