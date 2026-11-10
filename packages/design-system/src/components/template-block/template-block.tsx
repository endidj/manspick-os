// 안내 문구 복사와 수동 발송 표시를 제공하는 공통 컴포넌트입니다.
'use client';
import { useState } from 'react';
import type { HTMLAttributes } from 'react';
import { Button } from '../button';
import { Icon } from '../../icons';
import styles from './template-block.module.css';

export type TemplateBlockProps = Omit<HTMLAttributes<HTMLElement>, 'onCopy'> & {
  title: string;
  message: string;
  recommendation?: string;
  sent?: boolean;
  onSentChange?: (sent: boolean) => void;
  onCopy?: (message: string) => void | Promise<void>;
  variableHint?: string;
};

/** Copying a message and recording an already-sent message are separate operations. */
export function TemplateBlock({
  title,
  message,
  recommendation,
  sent = false,
  onSentChange,
  onCopy,
  variableHint = '{} 값은 고객 정보로 자동 채워짐',
  className = '',
  ...props
}: TemplateBlockProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');

  async function copy() {
    setCopyState('copying');
    try {
      if (onCopy) await onCopy(message);
      else await navigator.clipboard.writeText(message);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  }

  return (
    <section
      {...props}
      className={`${styles.templateBlock} ${className}`}
      data-sent={sent || undefined}
    >
      <div className={styles.templateHeading}>
        <strong>{title}</strong>
        {recommendation && <span>{recommendation}</span>}
      </div>
      <p className={styles.templateMessage}>{message}</p>
      <div className={styles.templateActions}>
        <Button
          size="sm"
          loading={copyState === 'copying'}
          leadingIcon={<Icon name="list" size={16} />}
          onClick={copy}
        >
          {copyState === 'copied' ? '복사 완료' : '복사'}
        </Button>
        {onSentChange && (
          <label className={styles.sentToggle} data-sent={sent || undefined}>
            <input
              type="checkbox"
              checked={sent}
              onChange={(event) => onSentChange(event.target.checked)}
            />
            카카오채널 발송 완료
          </label>
        )}
        <span className={styles.description}>{variableHint}</span>
      </div>
      <span
        className={copyState === 'error' ? styles.copyError : styles.visuallyHidden}
        role="status"
      >
        {copyState === 'error'
          ? '복사하지 못했습니다. 메시지를 직접 선택해 복사해주세요.'
          : copyState === 'copied'
            ? '메시지를 복사했습니다.'
            : ''}
      </span>
    </section>
  );
}
