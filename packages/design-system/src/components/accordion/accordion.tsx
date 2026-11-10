// 자주 묻는 질문을 접고 펼치는 공통 컴포넌트입니다.
import type { DetailsHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './accordion.module.css';

export type AccordionProps = Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'title'> & {
  title: ReactNode;
  children: ReactNode;
};

/** Native details/summary supplies keyboard activation and disclosure semantics without JS. */
export function Accordion({ title, children, className = '', ...props }: AccordionProps) {
  return (
    <details {...props} className={`${styles.accordion} ${className}`}>
      <summary>
        {title}
        <Icon name="chevron" size={20} />
      </summary>
      <div className={styles.accordionBody}>{children}</div>
    </details>
  );
}
