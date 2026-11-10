// 화면 상단의 브랜드와 동작을 배치하는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './app-bar.module.css';

export type AppBarProps = HTMLAttributes<HTMLElement> & {
  brand?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
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

export function AppBar({ brand, leading, actions, className = '', ...props }: AppBarProps) {
  return (
    <header {...props} className={`${styles.appBar} ${className}`}>
      <div className={styles.appBarIdentity}>
        {leading}
        {brand ?? <AppBarBrand />}
      </div>
      {actions && <div className={styles.appBarActions}>{actions}</div>}
    </header>
  );
}
