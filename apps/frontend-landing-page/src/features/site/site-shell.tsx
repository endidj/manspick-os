// 서비스 탐색 메뉴와 법률·고객 앱 이동을 모든 공개 화면에 제공합니다.
import Link from 'next/link';
import { AppBar, AppBarBrand, Brand } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { adminAppUrl, bookingUrl, localBooking } from './site-data';
import styles from './site-shell.module.css';

const navigation = [
  ['/#approach', '왜 맨즈픽?'],
  ['/#before-after', '변신 사례'],
  ['/#hows', '5가지 노하우'],
  ['/#reviews', '후기'],
  ['/#team', '팀 소개'],
  ['/#process', '진행 과정'],
  ['/#packages', '패키지'],
  ['/#faq', 'FAQ'],
] as const;

export function SiteHeader() {
  return (
    <AppBar
      className={styles.header}
      brand={
        <Link href="/" aria-label="MANSPICK 홈">
          <AppBarBrand />
        </Link>
      }
      actions={
        <div className={styles.headerActions}>
          <nav className={styles.desktopNav} aria-label="주요 메뉴">
            {navigation.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
          <Link href="/recommend" className={styles.recommendLink}>
            맞춤 설계 <Icon name="arrow" size={15} />
          </Link>
          <details className={styles.mobileMenu}>
            <summary aria-label="전체 메뉴">
              <Icon name="solar/hamburger-menu-linear" size={21} />
            </summary>
            <nav aria-label="모바일 주요 메뉴">
              {navigation.map(([href, label]) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      }
    />
  );
}

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <Link href="/" aria-label="맨즈픽 홈">
            <Brand />
          </Link>
          <p>자연스러운 나의 매력을 발견하는 시간.</p>
          <span className={styles.footerCategory}>MEN’S STYLING & PHOTOGRAPHY</span>
        </div>
        <nav aria-label="하단 메뉴">
          <Link href="/legal">이용·개인정보 안내</Link>
          <a href={bookingUrl}>
            {localBooking ? '고객 화면 체험' : '예약하기'} <Icon name="arrow" size={14} />
          </a>
          <a href={adminAppUrl}>
            직원 화면 체험 <Icon name="arrow" size={14} />
          </a>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <span>© MANSPICK. All rights reserved.</span>
        {localBooking && <span>로컬 미리보기 · 실제 예약·결제·상담과 연결되지 않습니다.</span>}
      </div>
    </footer>
  );
}
