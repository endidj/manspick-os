// 로컬 샘플 고객과 신규 예약 진입을 보여주는 개발용 홈입니다.
'use client';
import { useEffect, useState } from 'react';
import { AppBar, Badge, Notice, Loading } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { api } from '@manspick/web/client';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

type Demo = {
  notice: string;
  customers: { name: string; token: string; last4: string; shootId: string; status: string }[];
};
export function DemoHome() {
  const [demo, setDemo] = useState<Demo>();
  const [error, setError] = useState('');
  useEffect(() => {
    api<Demo>('/demo')
      .then(setDemo)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <AppBar
        className={styles['customer-header']}
        actions={
          <a className={[styles['text-link'], layout.small].join(' ')} href="http://localhost:3002">
            운영 앱 <Icon name="arrow" size={14} />
          </a>
        }
      />
      <main id="main" className={[styles['customer-width'], layout.stack].join(' ')}>
        <div className={[styles['booking-intro']].join(' ')}>
          <h1>
            가장 나다운 순간을
            <br />
            함께 준비해요.
          </h1>
          <p>
            맨즈픽 고객 앱의 첫 로컬 버전입니다.
            <br />
            새로운 예약을 만들거나 샘플 여정을 이어가세요.
          </p>
        </div>
        <a className={styles.button} href="/start">
          새 예약 체험하기 <Icon name="arrow" size={17} />
        </a>
        <section className={layout.stack}>
          <div className={layout.between}>
            <h2>샘플 촬영 둘러보기</h2>
            <Badge>로컬 전용</Badge>
          </div>
          {error && <Notice tone="error">{error}</Notice>}
          {!demo && !error && <Loading />}
          {demo?.customers.map((c) => (
            <a
              className={[styles['demo-customer']].join(' ')}
              key={c.shootId}
              href={`/s/${c.token}`}
            >
              <div className={[styles['demo-avatar']].join(' ')}>{c.name.slice(0, 1)}</div>
              <div>
                <strong>{c.name}</strong>
                <p className={layout.small}>확인 번호 {c.last4}</p>
              </div>
              <Icon name="arrow" size={18} />
            </a>
          ))}
        </section>
        <p className={[layout.small, layout.muted].join(' ')}>
          운영 배포에서 이 샘플 목록과 역할 선택 로그인은 제공되지 않습니다.
        </p>
      </main>
    </>
  );
}
