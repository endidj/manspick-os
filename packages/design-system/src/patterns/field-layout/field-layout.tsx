// 입력 요소와 라벨·도움말·오류를 같은 ID로 연결합니다.
'use client';

import { useId, type AriaAttributes, type ReactNode } from 'react';

export type FieldMessages = { label: string; hint?: ReactNode; error?: string };
type ControlAttributes = Pick<AriaAttributes, 'aria-describedby' | 'aria-invalid'> & {
  id?: string;
  required?: boolean;
};

export function FieldLayout({
  label,
  hint,
  error,
  control,
  styles,
  hideLabel,
  children,
}: FieldMessages & {
  control: ControlAttributes;
  styles: Record<string, string>;
  hideLabel?: boolean;
  children: (attributes: ControlAttributes) => ReactNode;
}) {
  const generatedId = useId();
  const id = control.id ?? generatedId;
  const description = [control['aria-describedby'], hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
        {control.required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': description || undefined,
        'aria-invalid': error ? true : control['aria-invalid'],
      })}
      {hint && (
        <div id={`${id}-hint`} className={styles.hint}>
          {hint}
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
