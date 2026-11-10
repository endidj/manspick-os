// 선택 입력에 라벨·도움말·오류를 연결하고 실제 선택값은 화면에서 관리합니다.
'use client';

import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import styles from './select-field.module.css';

export type SelectFieldOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<
  ComponentPropsWithRef<'select'>,
  'multiple' | 'children' | 'value' | 'defaultValue' | 'onChange'
> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectFieldOption[];
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
};

export function SelectField({
  label,
  value,
  onValueChange,
  options,
  hint,
  error,
  hideLabel = false,
  id,
  required,
  className = '',
  'aria-describedby': describedBy,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionIds =
    [describedBy, hint ? `${fieldId}-hint` : undefined, error ? `${fieldId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        {...props}
        id={fieldId}
        required={required}
        value={value}
        onChange={(event) => onValueChange(event.currentTarget.value)}
        aria-describedby={descriptionIds}
        aria-invalid={error ? true : props['aria-invalid']}
        className={`${styles.select} ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
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
