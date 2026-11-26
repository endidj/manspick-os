// 한 줄 입력과 도움말·오류를 연결하는 공통 컴포넌트입니다.
'use client';

import type { InputHTMLAttributes } from 'react';
import { FieldLayout, type FieldMessages } from '../field-layout/field-layout';
import styles from '../field-layout/text-control.module.css';

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange'
> &
  FieldMessages & {
    value: string;
    onValueChange: (value: string) => void;
  };

export function TextField({
  label,
  hint,
  error,
  onValueChange,
  className = '',
  ...control
}: TextFieldProps) {
  return (
    <FieldLayout label={label} hint={hint} error={error} styles={styles} control={control}>
      {(attributes) => (
        <input
          {...control}
          {...attributes}
          className={`${styles.input} ${className}`}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        />
      )}
    </FieldLayout>
  );
}
