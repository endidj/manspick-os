// 같은 고객 흐름 안에서는 입력 상태를 유지하며 URL과 브라우저 방문 기록을 갱신합니다.
'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useFlowNavigation(scope: string) {
  const pathname = usePathname();
  const router = useRouter();
  const navigate = useCallback(
    (path: string, replace = false) => {
      if (path !== scope && !path.startsWith(`${scope}/`)) return;
      if (window.location.pathname === path) return;
      const current = window.history.state?.manspickFlow;
      const depth = current?.scope === scope ? current.depth : 0;
      const state = { manspickFlow: { scope, depth: replace ? depth : depth + 1 } };
      // Next/Vinext가 라우터 메타데이터를 보존하고 usePathname을 갱신합니다.
      if (replace) window.history.replaceState(state, '', path);
      else window.history.pushState(state, '', path);
      window.scrollTo({ top: 0 });
    },
    [scope],
  );
  const back = useCallback(
    (fallback: string) => {
      const current = window.history.state?.manspickFlow;
      if (current?.scope === scope && current.depth > 0) window.history.back();
      else if (fallback === scope || fallback.startsWith(`${scope}/`)) navigate(fallback, true);
      else router.replace(fallback);
    },
    [navigate, router, scope],
  );

  return { pathname, navigate, back };
}
