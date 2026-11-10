// 공용 패키지의 피그마 원본 사진을 실제 크기와 설명에 맞춰 보여줍니다.
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
        alt={decorative ? '' : label}
        className={styles.brandImage}
        sizes="(max-width: 760px) 45vw, 360px"
        unoptimized
      />
      {caption && <span className={styles.mediaCaption}>{caption}</span>}
    </div>
  );
}
