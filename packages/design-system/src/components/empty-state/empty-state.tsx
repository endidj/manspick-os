// 내용이 없을 때 안내와 다음 동작을 보여주는 공통 컴포넌트입니다.
import type { ReactNode } from 'react';
import { Icon } from '../../icons';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon name="image" size={28} />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
