// 운영 목록의 고객 요약과 다음 동작을 보여주는 공통 컴포넌트입니다.
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../../icons';
import styles from './kanban-card.module.css';

export type KanbanCardProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'title'> & {
  href: string;
  title: string;
  packageLabel?: string;
  status: ReactNode;
  dateLabel: string;
  assignee?: string;
  nextAction?: string;
};

export function KanbanCard({
  href,
  title,
  packageLabel,
  status,
  dateLabel,
  assignee,
  nextAction,
  className = '',
  ...props
}: KanbanCardProps) {
  return (
    <a {...props} href={href} className={`${styles.kanbanCard} ${className}`}>
      <div className={styles.kanbanHeading}>
        <strong>{title}</strong>
        {packageLabel && <span>{packageLabel}</span>}
      </div>
      <div className={styles.kanbanStatus}>{status}</div>
      <div className={styles.kanbanMeta}>
        <span>
          <Icon name="calendar" size={14} />
          {dateLabel}
        </span>
        {assignee && (
          <span>
            <Icon name="people" size={14} />
            {assignee}
          </span>
        )}
      </div>
      {nextAction && (
        <div className={styles.kanbanNext}>
          <Icon name="arrow" size={14} />
          다음: {nextAction}
        </div>
      )}
    </a>
  );
}
