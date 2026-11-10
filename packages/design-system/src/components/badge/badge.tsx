// 짧은 상태 표시를 그리는 공통 컴포넌트입니다.
import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red';
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
