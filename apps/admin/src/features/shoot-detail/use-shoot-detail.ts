// 촬영 상세를 읽고 업무 명령의 저장 응답으로 최신 권한과 상태를 화면에 반영합니다.
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ShootAction, ShootDetail } from '@manspick/contracts';
import { action, api } from '@manspick/web/client';

export type PerformAction = (body: ShootAction) => Promise<boolean>;

export function useShootDetail(shootId: string) {
  const [shoot, setShoot] = useState<ShootDetail>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const refresh = useCallback(async () => {
    setShoot(await api<ShootDetail>(`/shoots/${encodeURIComponent(shootId)}`));
  }, [shootId]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  useEffect(() => {
    api<ShootDetail>(`/shoots/${encodeURIComponent(shootId)}`)
      .then(setShoot)
      .catch((cause) => setError((cause as Error).message));
  }, [shootId]);

  const perform: PerformAction = async (body) => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      setShoot(await action<ShootDetail>(shootId, body));
      setSuccess('변경 내용을 저장했습니다.');
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return { shoot, busy, loading, error, success, perform, reload, refresh };
}
