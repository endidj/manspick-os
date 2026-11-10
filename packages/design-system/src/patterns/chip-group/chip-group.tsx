// 여러 항목의 선택 또는 선택된 항목 제거를 제공하며 업무 조건은 화면에서 판단합니다.
'use client';

import { Button } from '../../components/button';
import styles from './chip-group.module.css';

export type ChipOption = { value: string; label: string; disabled?: boolean };
export type ChipGroupProps = {
  label: string;
  options: readonly ChipOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  mode?: 'select' | 'remove';
  hideLabel?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ChipGroup({
  label,
  options,
  value,
  onValueChange,
  mode = 'select',
  hideLabel = false,
  disabled = false,
  className = '',
}: ChipGroupProps) {
  const items =
    mode === 'remove'
      ? [...new Set(value)].map(
          (selected) =>
            options.find((option) => option.value === selected) ?? {
              value: selected,
              label: selected,
            },
        )
      : options;

  function toggle(selected: string) {
    onValueChange(
      value.includes(selected) ? value.filter((item) => item !== selected) : [...value, selected],
    );
  }

  return (
    <fieldset className={`${styles.group} ${className}`} disabled={disabled}>
      <legend className={hideLabel ? styles.visuallyHidden : styles.legend}>{label}</legend>
      <div className={styles.chips}>
        {items.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Button
              key={option.value}
              size="sm"
              variant={mode === 'select' && selected ? 'primary' : 'secondary'}
              className={styles.chip}
              data-mode={mode}
              disabled={disabled || option.disabled}
              aria-pressed={mode === 'select' ? selected : undefined}
              aria-label={mode === 'remove' ? `${label} ${option.label} 제거` : undefined}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}
