// 촬영 목록이 필요한 화면만 조회하고 조회 실패를 화면 안에서 다시 시도합니다.
import { useEffect, useState } from 'react';
import type { ShootListPageDTO, ShootSummary } from '@manspick/contracts';
import { api } from '@manspick/web/client';

async function loadShootList(signal: AbortSignal) {
  const shoots: ShootSummary[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const query = cursor ? `?${new URLSearchParams({ cursor })}` : '';
    const result: ShootListPageDTO = await api(`/shoots${query}`, { signal });
    shoots.push(...result.shoots);
    cursor = result.nextCursor;
    if (!cursor) return shoots;
  }
  throw new Error('촬영이 4,000건을 초과했습니다. 운영자에게 목록 범위 조정을 요청해주세요.');
}

export function useShootList(key: string | undefined) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    revision: number;
    shoots?: ShootSummary[];
    error?: string;
  }>();

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    loadShootList(controller.signal)
      .then((shoots) => {
        if (!controller.signal.aborted) setResult({ key, revision, shoots });
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setResult({ key, revision, error: (cause as Error).message });
      });
    return () => controller.abort();
  }, [key, revision]);

  const current = key && result?.key === key && result.revision === revision ? result : undefined;
  return {
    shoots: current?.shoots,
    error: current?.error,
    retry: () => setRevision((value) => value + 1),
  };
}
