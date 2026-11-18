// 로컬 SVG 아이콘을 색상과 접근성 이름에 맞게 표시합니다.
import type { CSSProperties, SVGProps } from 'react';
import sprite from '../assets/icons/sprite.svg?url';
import { iconAliases } from './manifest';
import type { IconName } from './manifest';
import styles from './icons.module.css';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'color'> {
  name: IconName;
  size?: number;
  color?: CSSProperties['color'];
  label?: string;
}

export function Icon({ name, size = 24, color, label, style, className, ...props }: IconProps) {
  const accessibleLabel = label ?? props['aria-label'];
  const labelled = Boolean(accessibleLabel || props['aria-labelledby']);
  const original = name in iconAliases ? iconAliases[name as keyof typeof iconAliases] : name;
  const symbol = original.replace('/', '-');
  return (
    <svg
      {...props}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={accessibleLabel}
      data-icon={name}
      viewBox="0 0 24 24"
      focusable="false"
      className={`${styles.icon}${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        color,
        ...style,
      }}
    >
      <use href={`${sprite}#${symbol}`} />
    </svg>
  );
}
