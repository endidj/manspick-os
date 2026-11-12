// 원본 운영 화면의 작은 경로 표시와 제목, 오른쪽 동작을 같은 간격으로 보여줍니다.
import type { ReactNode } from 'react';
import { SectionHeader } from '@manspick/design-system/patterns';
import styles from './workspace.module.css';

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.heading}>
      <SectionHeader
        className={styles.title}
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
