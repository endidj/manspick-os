// 해당 화면에서 실제 사용하는 작은 폰트 파일을 HTML에서 먼저 발견하게 합니다.
import { landingFontUrls } from '@manspick/design-system/assets';

export function FontPreload({ family }: { family: keyof typeof landingFontUrls }) {
  return (
    <link
      rel="preload"
      href={landingFontUrls[family]}
      as="font"
      type="font/woff2"
      crossOrigin="anonymous"
    />
  );
}
