// 추천 화면의 랜딩 토큰을 불러오고 제목과 숫자 글꼴을 미리 요청합니다.
import type { ReactNode } from 'react';
import '@manspick/design-system/styles/site-tokens.css';
import { FontPreload } from '../../features/seo';

export default function RecommendationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FontPreload family="display" />
      {children}
    </>
  );
}
