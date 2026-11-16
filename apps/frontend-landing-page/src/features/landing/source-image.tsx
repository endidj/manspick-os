// 원본 레이아웃의 img에 사전 생성한 웹용 사진과 반응형 후보를 연결합니다.
import type { ImgHTMLAttributes } from 'react';
import { sourceImages, type SourceImageName } from '@manspick/design-system/assets';

type SourceImageProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet' | 'width' | 'height' | 'sizes' | 'alt'
> & {
  name: SourceImageName;
  alt: string;
  sizes: string;
  thumbnail?: boolean;
};

export function SourceImage({
  name,
  sizes,
  alt,
  thumbnail = false,
  loading = 'lazy',
  decoding = 'async',
  ...props
}: SourceImageProps) {
  const image = sourceImages[name];
  // 아바타용 작은 사본이 큰 인물 사진에 선택되지 않도록 일반 규격을 유지합니다.
  const srcSet = thumbnail
    ? image.srcSet
    : image.variants
        .filter((variant) => variant.width >= Math.min(480, image.width))
        .map((variant) => `${variant.src} ${variant.width}w`)
        .join(', ');
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 이미지 인코딩은 독립 생성 단계에서 완료합니다.
    <img
      {...props}
      data-source-image={name}
      src={thumbnail ? image.thumbnailSrc : image.src}
      srcSet={srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={loading}
      decoding={decoding}
    />
  );
}
