// 서버에서 출력한 원본 화면에 정리 가능한 브라우저 상호작용만 연결합니다.
'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import '@manspick/design-system/styles/site-tokens.css';
import { attachSourceInteractions } from './source-runtime';
import styles from './source.module.css';

export function SourceExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current) return;
    return attachSourceInteractions(root.current);
  }, []);

  return (
    <div className={styles.root} ref={root}>
      <div className="source-body grain font-sans break-keep">{children}</div>
    </div>
  );
}
