// 고객 원본의 상단바·다섯 단계 표시·하단 행동 영역을 배치합니다.
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { customerLogo } from '@manspick/design-system/assets';
import { AppBar, Button, StepHeader } from '@manspick/design-system/components';
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
        className={styles.appBar}
        onBack={onBack}
        backLabel={backLabel}
        backPlacement="actions"
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
            <Image
              className={styles.logo}
              src={customerLogo}
              width={118}
              height={28}
              alt="MANSPICK"
              unoptimized
            />
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
                <Icon name="customer/help" size={16} />
                <span>문의하기</span>
              </a>
            </>
          )
        }
      />
      {step && <StepHeader className={styles.stepHeader} total={5} {...step} />}
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
      leadingIcon={<Icon name="customer/help" size={18} />}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SceneFooter({ children }: { children: ReactNode }) {
  return <div className={`${styles.footer} ${styles.sceneFooter}`}>{children}</div>;
}
