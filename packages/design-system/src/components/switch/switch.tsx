// 켜짐과 꺼짐을 선택하는 공통 토글이며 저장 동작은 사용하는 화면이 담당합니다.
'use client';

import type { ComponentPropsWithRef } from 'react';
import styles from './switch.module.css';

export type SwitchProps = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'children'
> & {
  label: string;
  hideLabel?: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function Switch({
  label,
  hideLabel = false,
  checked,
  onCheckedChange,
  className = '',
  ...props
}: SwitchProps) {
  return (
    <label className={`${styles.switch} ${className}`}>
      <input
        {...props}
        className={styles.input}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onCheckedChange(event.currentTarget.checked)}
      />
      <span className={hideLabel ? styles.visuallyHidden : undefined}>{label}</span>
    </label>
  );
}
