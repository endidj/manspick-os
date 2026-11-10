// 사진의 선택·업로드·오류 상태를 보여주는 공통 컴포넌트입니다.
import type { ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './photo-tile.module.css';

export type PhotoTileProps = {
  label: string;
  image?: ReactNode;
  selected?: boolean;
  selectionOrder?: number;
  onSelectedChange?: (selected: boolean) => void;
  disabled?: boolean;
  status?: 'ready' | 'uploading' | 'error' | 'private';
  progress?: number;
  onRetry?: () => void;
  footer?: ReactNode;
  className?: string;
};

/** Pass a native image or Next Image in `image`; the library owns no file URL or access policy. */
export function PhotoTile({
  label,
  image,
  selected = false,
  selectionOrder,
  onSelectedChange,
  disabled = false,
  status = 'ready',
  progress = 0,
  onRetry,
  footer,
  className = '',
}: PhotoTileProps) {
  const locked = disabled || status !== 'ready';
  const content = (
    <>
      {image ?? <Icon name={status === 'private' ? 'shield' : 'camera'} size={24} />}
      {onSelectedChange && (
        <span
          className={styles.photoSelection}
          data-selected={selected || undefined}
          aria-hidden="true"
        >
          {selected ? (selectionOrder ?? <Icon name="check" size={16} />) : null}
        </span>
      )}
      {footer && (
        <>
          {' '}
          <span className={styles.photoFooter}>{footer}</span>
        </>
      )}
    </>
  );
  return (
    <div
      className={`${styles.photoTile} ${className}`}
      data-selected={selected || undefined}
      data-status={status}
    >
      {onSelectedChange ? (
        <button
          type="button"
          className={styles.photoSurface}
          disabled={locked}
          aria-label={selected && selectionOrder ? `${selectionOrder} · ${label}` : label}
          aria-pressed={selected}
          onClick={() => onSelectedChange(!selected)}
        >
          {content}
        </button>
      ) : (
        <div className={styles.photoSurface} role="img" aria-label={label}>
          {content}
        </div>
      )}
      {status === 'uploading' && (
        <div
          className={styles.photoOverlay}
          role="progressbar"
          aria-label={`${label} 업로드`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, progress))}
        >
          {Math.round(Math.max(0, Math.min(100, progress)))}%
        </div>
      )}
      {status === 'error' && (
        <div className={styles.photoOverlay}>
          <span>업로드 실패</span>
          {onRetry && (
            <button type="button" className={styles.retry} onClick={onRetry}>
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}
