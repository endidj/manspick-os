// 로컬 SVG 아이콘을 색상과 접근성 이름에 맞게 표시합니다.
import type { CSSProperties, HTMLAttributes } from 'react';
import { iconManifest } from './manifest';
import type { IconName } from './manifest';

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
  name: IconName;
  size?: number;
  color?: CSSProperties['color'];
  label?: string;
}

export function Icon({ name, size = 24, color, label, style, ...props }: IconProps) {
  const accessibleLabel = label ?? props['aria-label'];
  const labelled = Boolean(accessibleLabel || props['aria-labelledby']);
  const mask = 'url("' + iconManifest[name] + '")';
  return (
    <span
      {...props}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={accessibleLabel}
      data-icon={name}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        verticalAlign: 'middle',
        color,
        backgroundColor: 'currentColor',
        maskImage: mask,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskImage: mask,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        WebkitMaskSize: 'contain',
        ...style,
      }}
    />
  );
}
