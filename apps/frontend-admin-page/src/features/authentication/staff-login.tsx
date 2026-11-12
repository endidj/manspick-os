// 직원 이메일로 로그인하고 시연 환경에서만 역할 선택을 표시합니다.
import { useEffect, useState, useSyncExternalStore } from 'react';
import type { StaffRole } from '@manspick/domain';
import { Button, Notice } from '@manspick/design-system/components';
import { TextField } from '@manspick/design-system/patterns';
import { api } from '@manspick/web/client';
import { roles } from '../workspace/model';
import styles from './staff-login.module.css';

type Props = {
  busy: boolean;
  error: string;
  token: string;
  onLogin: (role: StaffRole) => Promise<void>;
};

function subscribeToLink(notify: () => void) {
  window.addEventListener('hashchange', notify);
  return () => window.removeEventListener('hashchange', notify);
}

export function useStaffLoginToken() {
  return useSyncExternalStore(
    subscribeToLink,
    () => new URLSearchParams(window.location.hash.slice(1)).get('staffToken') ?? '',
    () => '',
  );
}

export function StaffLogin({ busy, error, onLogin, token }: Props) {
  const [attemptedLogin, setAttemptedLogin] = useState(false);
  const [options, setOptions] = useState<{ demo: boolean; email: boolean }>();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    api<{ demo: boolean; email: boolean }>('/auth/staff/options', { signal: controller.signal })
      .then(setOptions)
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage('로그인 정보를 불러오지 못했습니다. 새로고침해주세요.');
      });
    return () => controller.abort();
  }, []);

  function clearLink() {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new Event('hashchange'));
    setMessage('');
  }

  async function submit() {
    setSubmitting(true);
    setMessage('');
    setSent(false);
    try {
      if (token) {
        await api('/auth/staff/confirm', { method: 'POST', body: JSON.stringify({ token }) });
        clearLink();
        window.location.reload();
      } else {
        await api('/auth/staff/request', { method: 'POST', body: JSON.stringify({ email }) });
        setSent(true);
      }
    } catch (cause) {
      setMessage((cause as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main" className={styles.login} aria-busy={busy || submitting || undefined}>
      {(options?.email || token) && (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <h1>직원 로그인</h1>
          {!token && (
            <TextField
              label="회사 이메일"
              type="email"
              autoComplete="email"
              required
              value={email}
              onValueChange={setEmail}
            />
          )}
          <Button type="submit" loading={submitting} disabled={busy || submitting}>
            {token ? '로그인 계속' : '로그인 링크 받기'}
          </Button>
          {token && (
            <Button type="button" variant="ghost" disabled={submitting} onClick={clearLink}>
              새 링크 요청
            </Button>
          )}
        </form>
      )}
      {sent && (
        <Notice tone="success">등록된 회사 이메일이라면 로그인 링크를 받을 수 있습니다.</Notice>
      )}
      {message && <Notice tone="error">{message}</Notice>}
      {options && !options.demo && !options.email && !token && (
        <Notice tone="error">
          직원 로그인 발송이 아직 설정되지 않았습니다. 운영자에게 문의해주세요.
        </Notice>
      )}
      {options?.demo && (
        <div className={styles.roles}>
          {roles.map((role) => (
            <Button
              key={role.id}
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setAttemptedLogin(true);
                void onLogin(role.id);
              }}
            >
              {role.label}
            </Button>
          ))}
        </div>
      )}
      {attemptedLogin && error && <Notice tone="error">{error}</Notice>}
    </main>
  );
}
