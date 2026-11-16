// 로컬 SVG 아이콘을 색상과 접근성 이름에 맞게 표시합니다.
import type { CSSProperties, HTMLAttributes } from 'react';
import { iconManifest } from './manifest';
import type { IconName } from './manifest';
import styles from './icons.module.css';

export interface IconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
  name: IconName;
  size?: number;
  color?: CSSProperties['color'];
  label?: string;
}

export function Icon({ name, size = 24, color, label, style, className, ...props }: IconProps) {
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
      className={`${styles.icon}${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        color,
        ...({ '--mp-icon-mask': mask } as CSSProperties),
        ...style,
      }}
    />
  );
}
