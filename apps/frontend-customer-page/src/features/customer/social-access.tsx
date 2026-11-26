// 현재 예약의 인증 상태를 확인하고 설정된 로그인 제공자에게 연결합니다.
'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button, Loading, Notice } from '@manspick/design-system/components';
import { api } from '@manspick/web/client';

export function SocialAccess({ token, children }: { token: string; children: ReactNode }) {
  const [options, setOptions] = useState<{ providers: string[]; verified: boolean }>();
  const [error, setError] = useState('');
  const [recent, setRecent] = useState('');
  useEffect(() => {
    let active = true;
    api<{ providers: string[]; verified: boolean }>('/auth/customer/social')
      .then((value) => {
        if (!active) return;
        setOptions(value);
        try {
          setRecent(localStorage.getItem('manspick-login-provider') ?? '');
        } catch {}
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function signIn(provider: string) {
    try {
      const { url } = await api<{ url: string }>('/auth/customer/social/' + provider + '/start', {
        method: 'POST',
        body: '{}',
      });
      sessionStorage.setItem('manspick-social-return', token);
      window.location.assign(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (options && (!options.providers.length || options.verified)) return children;
  if (!options && !error) return <Loading />;
  return (
    <section>
      <h2>예약에 사용할 계정으로 로그인</h2>
      {error && <Notice>{error}</Notice>}
      {options?.providers.map((p) => (
        <Button key={p} onClick={() => void signIn(p)}>
          {p === 'kakao' ? '카카오' : 'Google'} 로그인{recent === p ? ' · 최근 사용' : ''}
        </Button>
      ))}
    </section>
  );
}
