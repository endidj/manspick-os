// 메뉴의 현재 위치와 부가 정보를 표시하는 공통 컴포넌트입니다.
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import styles from './nav-item.module.css';

export type NavItemProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  icon?: ReactNode;
  active?: boolean;
  badge?: ReactNode;
};

export function NavItem({
  href,
  icon,
  active = false,
  badge,
  children,
  className = '',
  ...props
}: NavItemProps) {
  return (
    <a
      {...props}
      href={href}
      className={`${styles.navItem} ${className}`}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
    >
      {icon}
      <span>{children}</span>
      {badge && <span className={styles.navBadge}>{badge}</span>}
    </a>
  );
}
