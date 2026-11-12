// 운영 페이지 오류가 발생했을 때 다시 불러올 수 있는 화면을 보여줍니다.
'use client';

import { Button, EmptyState } from '@manspick/design-system/components';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main">
      <EmptyState
        title="운영 화면을 불러오지 못했습니다"
        description="로컬 API 실행 상태를 확인하고 다시 시도해주세요."
        action={<Button onClick={reset}>다시 시도</Button>}
      />
    </main>
  );
}
