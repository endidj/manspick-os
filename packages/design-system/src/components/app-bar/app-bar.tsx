// 화면 상단의 브랜드와 동작을 배치하는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import { Button } from '../button';
import styles from './app-bar.module.css';

export type AppBarProps = HTMLAttributes<HTMLElement> & {
  brand?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  backPlacement?: 'leading' | 'actions';
};

export function AppBarBrand() {
  return (
    <span className={styles.appBrand}>
      <span className={styles.appBrandMark}>
        <Icon name="camera" size={16} />
      </span>
      MANSPICK
    </span>
  );
}

export function AppBar({
  brand,
  leading,
  actions,
  onBack,
  backLabel = '뒤로가기',
  backPlacement = 'leading',
  className = '',
  ...props
}: AppBarProps) {
  const backButton = onBack && (
    <Button
      variant="ghost"
      size="md"
      className={styles.appBarBack}
      aria-label={backLabel}
      onClick={onBack}
    >
      <Icon name="solar/arrow-left-linear" />
    </Button>
  );
  return (
    <header {...props} className={`${styles.appBar} ${className}`}>
      <div className={styles.appBarIdentity}>
        {backPlacement === 'leading' && backButton}
        {leading}
        {brand ?? <AppBarBrand />}
      </div>
      {(actions || (backButton && backPlacement === 'actions')) && (
        <div className={styles.appBarActions}>
          {backPlacement === 'actions' && backButton}
          {actions}
        </div>
      )}
    </header>
  );
}
