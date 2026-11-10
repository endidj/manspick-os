// 관련 내용을 하나의 표면에 묶는 공통 컴포넌트입니다.
import type { HTMLAttributes } from 'react';

export function Panel({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`panel ${className}`} {...props}>
      {children}
    </section>
  );
}
