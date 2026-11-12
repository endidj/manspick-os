// 운영 메뉴와 독립적으로 직원 세션 조회·시연 로그인·로그아웃을 처리합니다.
'use client';

import { useEffect, useState } from 'react';
import type { SessionDTO } from '@manspick/contracts';
import type { StaffRole } from '@manspick/domain';
import { api, ApiError } from '@manspick/web/client';

export function useStaffSession() {
  const [session, setSession] = useState<SessionDTO>();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api<SessionDTO>('/session', { signal: controller.signal })
      .then((result) => {
        if (
          !controller.signal.aborted &&
          result.actor.kind === 'staff' &&
          result.actor.role !== 'customer'
        ) {
          setSession(result);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted && !(cause instanceof ApiError && cause.status === 401))
          setError((cause as Error).message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setChecked(true);
      });
    return () => controller.abort();
  }, []);

  async function login(role: StaffRole) {
    setBusy(true);
    setError('');
    try {
      setSession(
        await api<SessionDTO>('/demo/session', { method: 'POST', body: JSON.stringify({ role }) }),
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/logout', { method: 'POST' });
      setSession(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return { session, checked, error, busy, login, logout, clearError: () => setError('') };
}
