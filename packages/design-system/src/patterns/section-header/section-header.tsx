// 내용 구역의 제목과 설명을 표시하는 공통 컴포넌트입니다.
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './section-header.module.css';

export type SectionHeaderProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  heading?: 'h1' | 'h2' | 'h3';
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  heading: Heading = 'h1',
  className = '',
  ...props
}: SectionHeaderProps) {
  return (
    <div {...props} className={`${styles.sectionHeader} ${className}`}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <Heading className={styles.sectionTitle}>{title}</Heading>
      {description && <div className={styles.description}>{description}</div>}
    </div>
  );
}
