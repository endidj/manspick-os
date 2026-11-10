// 맨즈픽 로고를 표시하는 공통 컴포넌트입니다.

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-symbol">
        m<span />
      </span>
      {!compact && (
        <span>
          manspick<span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
}
