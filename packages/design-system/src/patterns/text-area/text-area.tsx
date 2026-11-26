// 여러 줄 입력과 도움말·오류를 연결하는 공통 컴포넌트입니다.
'use client';

import type { TextareaHTMLAttributes } from 'react';
import { FieldLayout, type FieldMessages } from '../field-layout/field-layout';
import styles from '../field-layout/text-control.module.css';

export type TextAreaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'defaultValue' | 'onChange'
> &
  FieldMessages & {
    value: string;
    onValueChange: (value: string) => void;
  };

export function TextArea({
  label,
  hint,
  error,
  onValueChange,
  className = '',
  ...control
}: TextAreaProps) {
  return (
    <FieldLayout label={label} hint={hint} error={error} styles={styles} control={control}>
      {(attributes) => (
        <textarea
          {...control}
          {...attributes}
          className={`${styles.input} ${styles.multiline} ${className}`}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        />
      )}
    </FieldLayout>
  );
}
