// 화면 하단의 주요 동작을 묶는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './sticky-action-bar.module.css';

export type StickyActionBarProps = HTMLAttributes<HTMLElement> & { children: ReactNode };

/** In-flow sticky container. The application supplies actions and owns validation or submission. */
export function StickyActionBar({ children, className = '', ...props }: StickyActionBarProps) {
  return (
    <footer {...props} className={`${styles.stickyBar} ${className}`}>
      <div className={styles.stickyContent}>{children}</div>
    </footer>
  );
}
