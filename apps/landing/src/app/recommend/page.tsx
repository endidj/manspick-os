// 피그마의 모바일 추천 화면에 맞춘 좁은 앱 셸을 제공합니다.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AppBar, AppBarBrand, Notice } from '@manspick/design-system/components';
import { PackageQuiz } from '../../features/package-quiz';
import { loadPublicCatalog } from '../../features/site/catalog';
import { bookingUrl } from '../../features/site';
import styles from './recommend.module.css';

export const metadata: Metadata = { title: '나에게 맞는 촬영' };
export const dynamic = 'force-dynamic';

export default async function RecommendPage() {
  const catalog = await loadPublicCatalog();
  return (
    <div className={styles.shell}>
      <AppBar
        brand={
          <Link href="/" aria-label="MANSPICK 홈">
            <AppBarBrand />
          </Link>
        }
        actions={
          <Link href="/" className={styles.homeLink}>
            메인으로
          </Link>
        }
        className={styles.appBar}
      />
      <main id="main-content" className={styles.main}>
        {catalog?.packages.length ? (
          <PackageQuiz {...catalog} />
        ) : (
          <Notice>
            지금은 추천에 사용할 상품을 불러올 수 없습니다. <a href={bookingUrl}>예약 화면 확인</a>
          </Notice>
        )}
      </main>
    </div>
  );
}
