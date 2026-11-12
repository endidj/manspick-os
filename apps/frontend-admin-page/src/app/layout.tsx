// 관리자 앱에 공용 디자인 시스템과 검색 제외 메타데이터를 적용합니다.
import type { Metadata } from 'next';
import '@manspick/design-system/styles';
export const metadata: Metadata = {
  title: '맨즈픽 OS · 운영',
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
