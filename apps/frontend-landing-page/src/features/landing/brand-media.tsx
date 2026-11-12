// 공용 패키지의 시연 이미지를 브랜드 이미지 영역에 보여줍니다.
import Image from 'next/image';
import { brandImages, type BrandImageName } from '@manspick/design-system/assets';
import styles from './landing.module.css';

export function BrandMedia({
  name,
  label,
  caption,
  className = '',
  decorative = false,
}: {
  name: BrandImageName;
  label: string;
  caption?: string;
  className?: string;
  decorative?: boolean;
}) {
  return (
    <div className={`${styles.brandMedia} ${className}`}>
      <Image
        {...brandImages[name]}
        alt={decorative ? '' : `시연 이미지 · ${label}`}
        className={styles.brandImage}
        sizes="(max-width: 760px) 45vw, 360px"
        unoptimized
      />
      {caption && <span className={styles.mediaCaption}>{caption}</span>}
    </div>
  );
}
