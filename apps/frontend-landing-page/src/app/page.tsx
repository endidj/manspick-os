// 원본 사이트를 React 서버 화면으로 제공하고 검색 메타데이터를 연결합니다.
import { LandingPage } from '../features/landing';
import { pageMetadata, StructuredData } from '../features/seo';

export const metadata = pageMetadata({
  title: '남자 프로필사진·소개팅사진·이미지컨설팅',
  description:
    '남성 전문 프로필 사진과 이미지 컨설팅. 의상·공간·보정·디렉팅까지 맨즈픽에서 나다운 첫인상을 준비하세요.',
  path: '/',
});

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <LandingPage />
    </>
  );
}
