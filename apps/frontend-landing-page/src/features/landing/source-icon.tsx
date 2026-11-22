// 공용 원본 SVG를 운영 사이트의 1em 크기·기준선으로 표시합니다.
import { Icon, type IconProps } from '@manspick/design-system/icons';

type SourceIconProps = Omit<IconProps, 'name'> & {
  name: IconProps['name'] | 'solar/quote-open-bold' | 'solar/ring-bold' | 'solar/briefcase-bold';
};

export function SourceIcon({ className = '', style, name, ...props }: SourceIconProps) {
  // 원본에서도 404인 세 이름은 빈 inline footprint를 유지합니다.
  if (
    name === 'solar/quote-open-bold' ||
    name === 'solar/ring-bold' ||
    name === 'solar/briefcase-bold'
  ) {
    return (
      <svg
        {...props}
        aria-hidden="true"
        focusable="false"
        className={className}
        style={{ display: 'inline-block', width: 0, height: 0, verticalAlign: 0, ...style }}
      />
    );
  }
  return (
    <Icon
      {...props}
      name={
        name === 'mdi/instagram'
          ? 'site/instagram'
          : name === 'ri/kakao-talk-fill'
            ? 'site/kakao-talk-fill'
            : name
      }
      className={`source-icon ${className}`}
      style={{ width: '1em', height: '1em', verticalAlign: 0, ...style }}
    />
  );
}
