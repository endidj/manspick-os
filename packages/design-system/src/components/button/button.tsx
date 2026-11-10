// 크기와 상태를 갖춘 공통 버튼을 그리는 공통 컴포넌트입니다.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './button.module.css';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'kakao' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

/** Native button semantics; callers own the action and its pending state. */
export function Button({
  variant = 'primary',
  size = 'lg',
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${styles.button} ${className}`}
      data-variant={variant}
      data-size={size}
      data-full-width={fullWidth || undefined}
      data-contrast-exception={variant === 'primary' ? 'figma-blue500' : undefined}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}
