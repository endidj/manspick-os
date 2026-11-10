// 안내·성공·오류 메시지를 전달하는 공통 컴포넌트입니다.
import type { HTMLAttributes } from 'react';

export function Notice({
  children,
  tone = 'info',
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: 'info' | 'error' | 'success' | 'warning';
}) {
  return (
    <div
      className={`notice notice-${tone}${className ? ` ${className}` : ''}`}
      role={tone === 'error' ? 'alert' : 'status'}
      {...props}
    >
      {children}
    </div>
  );
}
