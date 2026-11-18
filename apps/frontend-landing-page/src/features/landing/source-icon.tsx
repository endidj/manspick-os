// 공용 원본 SVG를 운영 사이트의 1em 크기·기준선으로 표시합니다.
import { Icon, type IconProps } from '@manspick/design-system/icons';

type SourceIconProps = Omit<IconProps, 'name'> & {
  name: IconProps['name'] | 'solar/quote-open-bold';
};

export function SourceIcon({ className = '', style, name, ...props }: SourceIconProps) {
  // 원본에서 누락된 인용 아이콘의 표시 공간을 유지합니다.
  if (name === 'solar/quote-open-bold') {
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
