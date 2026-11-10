// 역할별 운영 메뉴와 로그인한 직원 정보를 공통 사이드바에 보여줍니다.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppBar, AppBarBrand, Button, NavItem } from '@manspick/design-system/components';
import { Icon, type IconName } from '@manspick/design-system/icons';
import type { Actor } from '@manspick/contracts';
import { roles, visibleMenu, type View } from '../workspace/model';
import styles from './admin-shell.module.css';

type Props = {
  actor: Actor;
  view: View;
  detail: boolean;
  busy: boolean;
  onNavigate: (view: View) => void;
  onLogout: () => Promise<void>;
  children: ReactNode;
};

export function AdminShell({ actor, view, detail, busy, onNavigate, onLogout, children }: Props) {
  if (actor.role === 'customer') return null;
  const roleLabel = roles.find((role) => role.id === actor.role)?.label;
  return (
    <div className={styles.shell} data-role={actor.role} data-detail={detail || undefined}>
      <aside className={styles.sidebar}>
        <AppBar
          className={styles.sidebarHeader}
          brand={
            <Link href="/" aria-label="MANSPICK OS 운영 홈">
              <AppBarBrand />
            </Link>
          }
        />
        <div className={styles.roleCaption}>
          {actor.role === 'retoucher'
            ? '보정가 · 권한 제한'
            : actor.role === 'director'
              ? '디렉터 · 내 고객'
              : '직원 · 관리자'}
        </div>
        <nav className={styles.navigation} aria-label="운영 메뉴">
          {visibleMenu(actor.role).map((item) => (
            <NavItem
              key={item.id}
              href={`/?view=${item.id}`}
              active={detail ? item.id === 'detail' : view === item.id}
              className={styles.navItem}
              icon={<Icon name={item.icon as IconName} size={18} />}
              onClick={
                detail
                  ? undefined
                  : (event) => {
                      if (
                        event.ctrlKey ||
                        event.metaKey ||
                        event.shiftKey ||
                        event.altKey ||
                        event.button !== 0
                      )
                        return;
                      event.preventDefault();
                      onNavigate(item.id);
                    }
              }
            >
              {item.label}
            </NavItem>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">
              {actor.name.slice(0, 1)}
            </span>
            <div className={styles.identityText}>
              <strong>{actor.name}</strong>
              <span>
                {actor.role} · {roleLabel}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="로그아웃"
              loading={busy}
              onClick={onLogout}
            >
              <Icon name="logout" size={17} />
            </Button>
          </div>
        </div>
      </aside>
      <div className={styles.content}>
        <main id="main" className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
