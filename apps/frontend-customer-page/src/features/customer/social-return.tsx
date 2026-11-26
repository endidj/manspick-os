// 제공자의 일회용 코드를 예약 세션에 연결하고 개인 링크 화면을 복원합니다.
'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@manspick/web/client';
import { Loading, Notice } from '@manspick/design-system/components';

export function SocialReturn({ provider }: { provider: string }) {
  const started = useRef(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function finish() {
      const query = new URLSearchParams(window.location.search);
      const token = sessionStorage.getItem('manspick-social-return');
      history.replaceState(null, '', window.location.pathname);
      if (!token || !query.get('code') || !query.get('state'))
        throw new Error('로그인을 완료하지 못했습니다. 기존 예약 링크에서 다시 시도해주세요.');
      await api('/auth/customer/social/' + provider + '/finish', {
        method: 'POST',
        body: JSON.stringify({ code: query.get('code'), state: query.get('state') }),
      });
      sessionStorage.removeItem('manspick-social-return');
      sessionStorage.setItem('manspick-social-resume', token);
      try {
        localStorage.setItem('manspick-login-provider', provider);
      } catch {}
      window.location.replace('/s/' + encodeURIComponent(token) + '/survey/1');
    }
    finish().catch((e: Error) => setError(e.message));
  }, [provider]);
  return <main>{error ? <Notice>{error}</Notice> : <Loading />}</main>;
}
