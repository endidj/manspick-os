// 공개 페이지에 공통 메타데이터·폰트·기본 스타일을 적용합니다.
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@manspick/design-system/styles';

export const metadata: Metadata = {
  title: { default: '맨즈픽 — 자연스러운 나의 매력', template: '%s | 맨즈픽' },
  description:
    '남성을 위한 스타일링과 프로필 사진. 나에게 맞는 스타일을 찾고, 자연스러운 나의 매력을 담습니다.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a href="#main-content" className="skip-link">
          본문으로 바로가기
        </a>
        {children}
      </body>
    </html>
  );
}
