// 피그마의 섹션 순서대로 맨즈픽 서비스 소개 화면을 보여줍니다.
import { LandingPage } from '../features/landing';
import { SiteFooter, SiteHeader } from '../features/site';
import { loadPublicCatalog } from '../features/site/catalog';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const catalog = await loadPublicCatalog();
  return (
    <>
      <SiteHeader />
      <LandingPage catalog={catalog} />
      <SiteFooter />
    </>
  );
}
