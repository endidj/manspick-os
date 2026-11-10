// 항목 이름과 값을 나란히 표시하는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './info-row.module.css';

export type InfoRowProps = HTMLAttributes<HTMLDListElement> & { label: string; value: ReactNode };

export function InfoRow({ label, value, className = '', ...props }: InfoRowProps) {
  return (
    <dl {...props} className={`${styles.infoRow} ${className}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </dl>
  );
}
