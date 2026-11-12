// 실제 운영 설정을 읽고 저장 응답에 담긴 최신 값을 사용합니다.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { OperationsSettingsDTO, SettingsAction } from '@manspick/contracts';
import { api } from '@manspick/web/client';

export function useSettings() {
  const [data, setData] = useState<OperationsSettingsDTO>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');
  const readVersion = useRef(0);
  const saving = useRef(false);

  const refresh = useCallback((signal?: AbortSignal) => {
    const version = ++readVersion.current;
    return api<OperationsSettingsDTO>('/settings', { signal })
      .then((result) => {
        if (version === readVersion.current && !signal?.aborted) {
          setData(result);
          setError('');
        }
      })
      .catch((cause: unknown) => {
        if (version === readVersion.current && !signal?.aborted) setError((cause as Error).message);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  async function save(body: SettingsAction) {
    if (saving.current) return false;
    saving.current = true;
    readVersion.current++;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      setData(
        await api<OperationsSettingsDTO>('/settings', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      );
      setSuccess('변경 내용을 저장했습니다.');
      return true;
    } catch (cause) {
      setError((cause as Error).message);
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function retry() {
    if (saving.current) return;
    setError('');
    await refresh();
  }

  return { data, error, busy, success, save, retry };
}
