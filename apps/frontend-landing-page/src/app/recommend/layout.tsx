// 추천 화면의 영문 제목·숫자 글꼴만 미리 요청합니다.
import type { ReactNode } from 'react';
import { FontPreload } from '../../features/seo';

export default function RecommendationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FontPreload family="geist" />
      {children}
    </>
  );
}
