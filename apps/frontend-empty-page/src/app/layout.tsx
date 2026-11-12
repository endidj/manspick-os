// 앱의 공통 스타일과 맨즈픽 상단 바를 적용합니다.
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppBar } from '@manspick/design-system/components/app-bar';
import '@manspick/design-system/styles';

export const metadata: Metadata = {
  title: '맨즈픽 Empty',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
