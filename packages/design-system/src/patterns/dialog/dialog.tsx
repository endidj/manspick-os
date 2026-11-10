// 열림 상태에 따라 대화상자나 서랍을 띄우는 공통 컴포넌트입니다.
'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './dialog.module.css';

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  presentation?: 'modal' | 'drawer';
  closeLabel?: string;
  className?: string;
};

/** Native showModal provides focus containment, inert background, Escape and focus return. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actions,
  presentation = 'modal',
  closeLabel = '닫기',
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className={`${styles.dialog} ${className}`}
      data-presentation={presentation}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
    >
      <div className={styles.dialogHeading}>
        <h2 id={titleId} className={styles.dialogTitle}>
          {title}
        </h2>
        <button type="button" className={styles.dialogClose} onClick={() => onOpenChange(false)}>
          {closeLabel}
        </button>
      </div>
      <div className={styles.dialogBody}>
        {description && (
          <p id={descriptionId} className={styles.description}>
            {description}
          </p>
        )}
        {children}
      </div>
      {actions && <div className={styles.dialogActions}>{actions}</div>}
    </dialog>
  );
}
