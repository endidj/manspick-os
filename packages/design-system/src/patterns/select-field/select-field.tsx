// 선택 입력에 라벨·도움말·오류를 연결하고 실제 선택값은 화면에서 관리합니다.
'use client';

import type { ComponentPropsWithRef } from 'react';
import { FieldLayout, type FieldMessages } from '../field-layout/field-layout';
import styles from './select-field.module.css';

export type SelectFieldOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<
  ComponentPropsWithRef<'select'>,
  'multiple' | 'children' | 'value' | 'defaultValue' | 'onChange'
> &
  FieldMessages & {
    value: string;
    onValueChange: (value: string) => void;
    options: readonly SelectFieldOption[];
    hideLabel?: boolean;
  };

export function SelectField({
  label,
  hint,
  error,
  onValueChange,
  options,
  hideLabel,
  className = '',
  ...control
}: SelectFieldProps) {
  return (
    <FieldLayout
      label={label}
      hint={hint}
      error={error}
      styles={styles}
      control={control}
      hideLabel={hideLabel}
    >
      {(attributes) => (
        <select
          {...control}
          {...attributes}
          className={`${styles.select} ${className}`}
          onChange={(event) => onValueChange(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FieldLayout>
  );
}
