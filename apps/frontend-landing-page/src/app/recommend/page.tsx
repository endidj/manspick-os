// 원본 상담 상품과 패키지 직접 선택 주소를 서버 메타데이터에 연결합니다.
import {
  PackageQuiz,
  directPackage,
  marketingPackages,
  marketingAddons,
} from '../../features/package-quiz';
import { pageMetadata } from '../../features/seo';
import styles from './recommend.module.css';

export const metadata = pageMetadata({
  title: '맞춤 패키지 추천',
  description:
    '촬영 목적, 스타일 고민, 규모와 예산에 맞는 맨즈픽 프로필 촬영 패키지를 찾아보세요. 패키지와 추가 옵션을 골라 예상 상담 견적을 확인할 수 있습니다.',
  path: '/recommend',
  index: false,
});
export const dynamic = 'force-dynamic';

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ pkg?: string | string[] }>;
}) {
  const query = await searchParams;
  const initialPackage = directPackage(query.pkg, marketingPackages);
  return (
    <div className={styles.shell}>
      <main id="main-content" className={styles.main}>
        <PackageQuiz
          key={initialPackage ?? 'quiz'}
          packages={marketingPackages}
          addons={marketingAddons}
          initialPackage={initialPackage}
        />
      </main>
    </div>
  );
}
