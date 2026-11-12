// 디렉터 휴대폰 화면의 뒤로가기와 두 줄 제목을 원본 높이로 표시합니다.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppBar } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import styles from './director.module.css';

export function MobileHeader({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle: string;
  back?: string;
  actions?: ReactNode;
}) {
  return (
    <AppBar
      className={styles.header}
      leading={
        back && (
          <Link href={back} aria-label="이전 화면">
            <Icon name="back" size={22} />
          </Link>
        )
      }
      brand={
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
      }
      actions={actions}
    />
  );
}
