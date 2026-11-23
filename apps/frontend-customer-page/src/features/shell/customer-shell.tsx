// 고객 원본의 상단바·일곱 단계 표시·하단 행동 영역을 배치합니다.
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppBar, AppBarBrand, Button, StepHeader } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import styles from './customer-shell.module.css';

export const kakaoChannelUrl = 'https://pf.kakao.com/_kNxoMn';

export function CustomerShell({
  children,
  actions,
  accountAction,
  onBack,
  backLabel = '뒤로가기',
  step,
  footer,
  onHome,
}: {
  children: ReactNode;
  actions?: ReactNode;
  accountAction?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  step?: { title: string; current: number };
  footer?: ReactNode;
  onHome?: () => void;
}) {
  return (
    <div className={styles.shell}>
      <AppBar
        className={onBack ? styles.appBar : `${styles.appBar} ${styles.brandBar}`}
        onBack={onBack}
        backLabel={backLabel}
        brand={
          <Link
            href="/"
            onClick={
              onHome
                ? (event) => {
                    event.preventDefault();
                    onHome();
                  }
                : undefined
            }
          >
            <AppBarBrand />
          </Link>
        }
        actions={
          actions ?? (
            <>
              {accountAction}
              <a
                className={styles.helpLink}
                href={kakaoChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="chat" size={16} /> 문의하기
              </a>
            </>
          )
        }
      />
      {step && <StepHeader className={styles.stepHeader} {...step} />}
      <main id="main" className={styles.main}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
    </div>
  );
}

export function KakaoButton({
  children = '카카오채널로 문의하기',
  onClick,
}: {
  children?: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      fullWidth
      variant="kakao"
      leadingIcon={<Icon name="chat" size={18} />}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SceneFooter({ children }: { children: ReactNode }) {
  return <div className={`${styles.footer} ${styles.sceneFooter}`}>{children}</div>;
}
