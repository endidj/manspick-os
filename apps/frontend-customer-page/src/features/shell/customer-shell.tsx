// 고객 원본의 상단바·일곱 단계 표시·하단 행동 영역을 배치합니다.
'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AppBar, AppBarBrand, Button, StepHeader } from '@manspick/design-system/components';
import { Dialog } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import styles from './customer-shell.module.css';

export function CustomerShell({
  children,
  actions,
  onBack,
  backLabel = '나의 촬영 홈으로',
  step,
  footer,
  onHelp,
  onHome,
}: {
  children: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  step?: { title: string; current: number };
  footer?: ReactNode;
  onHelp?: () => void;
  onHome?: () => void;
}) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <AppBar
        className={styles.appBar}
        leading={
          onBack ? (
            <Button variant="ghost" aria-label={backLabel} onClick={onBack}>
              <Icon name="solar/arrow-left-linear" size={20} />
            </Button>
          ) : undefined
        }
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
            <button className={styles.helpLink} onClick={onHelp ?? (() => setHelpOpen(true))}>
              <Icon name="chat" size={16} /> 문의하기
            </button>
          )
        }
      />
      {step && <StepHeader className={styles.stepHeader} {...step} />}
      <main id="main" className={styles.main}>
        {children}
      </main>
      {footer && <footer className={styles.footer}>{footer}</footer>}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen} title="카카오채널 문의">
        <p>상담을 진행한 카카오채널로 연락해주세요. 공식 채널 주소는 아직 등록되지 않았어요.</p>
      </Dialog>
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
      leadingIcon={<Icon name="ri/kakao-talk-fill" size={18} />}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function SceneFooter({ children }: { children: ReactNode }) {
  return <div className={`${styles.footer} ${styles.sceneFooter}`}>{children}</div>;
}
