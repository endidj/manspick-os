// 키보드로 이동할 수 있는 탭과 내용을 연결하는 공통 컴포넌트입니다.
'use client';

import { useId, useRef, type ReactNode, type KeyboardEvent } from 'react';
import styles from './tabs.module.css';

export type TabItem = { value: string; label: string; content: ReactNode; disabled?: boolean };
export type TabsProps = {
  label: string;
  items: readonly TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: 'default' | 'flush';
  className?: string;
};

/** Manual activation: arrows/Home/End move focus; Enter/Space activates a tab. */
export function Tabs({
  label,
  items,
  value,
  onValueChange,
  variant = 'default',
  className = '',
}: TabsProps) {
  const groupId = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected =
    items.find((item) => item.value === value && !item.disabled) ??
    items.find((item) => !item.disabled);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const enabled = items
      .map((item, itemIndex) => (item.disabled ? -1 : itemIndex))
      .filter((itemIndex) => itemIndex >= 0);
    const current = enabled.indexOf(index);
    let next: number | undefined;
    if (event.key === 'ArrowRight') next = enabled[(current + 1) % enabled.length];
    if (event.key === 'ArrowLeft') next = enabled[(current - 1 + enabled.length) % enabled.length];
    if (event.key === 'Home') next = enabled[0];
    if (event.key === 'End') next = enabled.at(-1);
    if (next !== undefined) {
      event.preventDefault();
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <div className={`${styles.tabs} ${className}`} data-variant={variant}>
      <div role="tablist" aria-label={label} className={styles.tabList}>
        {items.map((item, index) => (
          <button
            key={item.value}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            id={`${groupId}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={selected?.value === item.value}
            aria-controls={`${groupId}-panel-${index}`}
            tabIndex={selected?.value === item.value ? 0 : -1}
            disabled={item.disabled}
            className={styles.tab}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => onValueChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.value}
          id={`${groupId}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${groupId}-tab-${index}`}
          hidden={selected?.value !== item.value}
          tabIndex={0}
          className={styles.tabPanel}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
