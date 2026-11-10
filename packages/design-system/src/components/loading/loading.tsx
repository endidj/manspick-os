// 불러오는 중임을 알리는 공통 컴포넌트입니다.

export function Loading() {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" />
      불러오는 중입니다
    </div>
  );
}
