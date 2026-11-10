// 공용 디자인 시스템과 검색 비공개 메타데이터를 고객 앱에 적용합니다.
import type { Metadata } from 'next';
import '@manspick/design-system/styles';

export const metadata: Metadata = {
  title: '맨즈픽 · 나의 촬영',
  description: '촬영 준비부터 가장 나다운 사진을 만나는 순간까지.',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main">
          본문으로 이동
        </a>
        {children}
      </body>
    </html>
  );
}
