// 고객 화면의 예기치 않은 오류와 다시 시도를 안내합니다.
'use client';
import { Button, EmptyState } from '@manspick/design-system/components';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="customer-width">
      <EmptyState
        title="화면을 불러오지 못했습니다"
        description="입력 내용은 서버에 마지막으로 저장된 상태로 유지됩니다."
        action={<Button onClick={reset}>다시 시도</Button>}
      />
    </main>
  );
}
