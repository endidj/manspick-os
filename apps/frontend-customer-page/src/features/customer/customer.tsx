// 개인 링크 인증·촬영 조회·실제 업무 요청을 고객 원본의 개별 화면에 연결합니다.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Loading, Notice } from '@manspick/design-system/components';
import { TextField } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import { api, action } from '@manspick/web/client';
import type { SessionDTO, ShootDetail } from '@manspick/contracts';
import { Survey, SurveyComplete } from '../survey';
import { CustomerShell, KakaoButton, kakaoChannelUrl } from '../shell';
import { CustomerHome } from './customer-home';
import { PreparationView, PlanView, ShootDayView } from './preparation';
import { SocialAccess } from './social-access';
import { PaymentView } from './payment';
import type { CustomerScene } from './journey';
import { customerPath, customerParent, customerRoute } from './routes';
import { useFlowNavigation } from '../shell/flow-navigation';
import layout from '../shell/customer-shell.module.css';
import styles from './customer.module.css';

const sceneSteps: Partial<Record<CustomerScene, { title: string; current: number }>> = {
  payment: { title: '촬영 일정 선택', current: 2 },
  survey: { title: '설문 작성', current: 3 },
  'survey-complete': { title: '설문 작성', current: 3 },
  preparation: { title: '촬영 준비 확인', current: 4 },
  plan: { title: '촬영 준비 확인', current: 4 },
  'shoot-day': { title: '촬영 진행', current: 5 },
};

const uploadKeys = new WeakMap<File, Map<string, string>>();

export function CustomerApp({ token }: { token: string }) {
  const [shoot, setShoot] = useState<ShootDetail>();
  const [shootId, setShootId] = useState('');
  const [verified, setVerified] = useState(false);
  const [last4, setLast4] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const dataVersion = useRef(0);
  const mutations = useRef(0);
  const root = customerPath(token, 'home');
  const { pathname, navigate: navigatePath, back } = useFlowNavigation(root);
  const route = customerRoute(pathname.slice(root.length).split('/').filter(Boolean));
  const scene = route?.scene ?? 'home';
  const surveyPage = route?.surveyPage ?? 1;
  const refresh = useCallback(async (id: string) => {
    const version = ++dataVersion.current;
    const latest = await api<ShootDetail>(`/shoots/${id}`);
    if (version === dataVersion.current) setShoot(latest);
  }, []);

  useEffect(() => {
    if (
      verified &&
      ((scene === 'survey' && !route?.surveyPage) ||
        (scene === 'survey-complete' && !shoot?.survey?.submittedAt))
    ) {
      const resumePage = shoot?.survey?.submittedAt
        ? 1
        : ([1, 2, 3, 4].find((page) => !shoot?.survey?.pageDone.includes(page)) ?? 4);
      navigatePath(customerPath(token, 'survey', resumePage), true);
    }
  }, [verified, scene, route?.surveyPage, shoot?.survey, token, navigatePath]);

  useEffect(() => {
    if (!verified || !shootId || !['home', 'payment', 'shoot-day'].includes(scene) || busy) return;
    let active = true;
    let checking = false;
    const update = async () => {
      if (!active || checking || mutations.current || document.visibilityState === 'hidden') return;
      checking = true;
      try {
        await refresh(shootId);
      } catch {
        // 일시적인 자동 갱신 실패는 현재 화면과 입력을 유지합니다. 직접 확인은 오류를 안내합니다.
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(() => void update(), 15000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      active = false;
      dataVersion.current += 1;
      clearInterval(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [verified, shootId, scene, busy, refresh]);

  async function checkStatus() {
    if (refreshing || mutations.current) return;
    setRefreshing(true);
    setError('');
    try {
      await refresh(shootId);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('manspick-social-resume') !== token) return;
    let active = true;
    api<{ shootId: string | null }>('/auth/customer/resume', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async ({ shootId: id }) => {
        if (!id || !active) return;
        await refresh(id);
        if (active) {
          setShootId(id);
          setVerified(true);
          sessionStorage.removeItem('manspick-social-resume');
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token, refresh]);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await api<SessionDTO>('/auth/customer', {
        method: 'POST',
        body: JSON.stringify({ token, last4 }),
      });
      const id = session.shootId ?? session.actor.shootId ?? '';
      setShootId(id);
      await refresh(id);
      setVerified(true);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function perform(body: unknown, message = '저장했습니다') {
    dataVersion.current += 1;
    mutations.current += 1;
    const quiet =
      (body as { type?: string; submit?: boolean }).type === 'save_survey' &&
      !(body as { submit?: boolean }).submit;
    if (!quiet) setBusy(true);
    setError('');
    try {
      setShoot(await action<ShootDetail>(shootId, body));
      setAnnouncement(message);
      return true;
    } catch (failure) {
      setError((failure as Error).message);
      return false;
    } finally {
      mutations.current -= 1;
      if (!quiet) setBusy(false);
    }
  }

  async function upload(file: File, kind: string) {
    dataVersion.current += 1;
    mutations.current += 1;
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.set('shootId', shootId);
      form.set('kind', kind);
      form.set('file', file);
      const fileKeys = uploadKeys.get(file) ?? new Map<string, string>();
      uploadKeys.set(file, fileKeys);
      const scope = `${shootId}/${kind}`;
      const key = fileKeys.get(scope) ?? crypto.randomUUID();
      fileKeys.set(scope, key);
      const asset = await api<{ id: string }>('/uploads', {
        method: 'POST',
        body: form,
        headers: { 'Idempotency-Key': key },
      });
      fileKeys.delete(scope);
      setAnnouncement('사진을 올렸습니다');
      await refresh(shootId).catch(() =>
        setError('사진은 올라갔지만 목록을 갱신하지 못했습니다. 화면을 다시 열어 확인해주세요.'),
      );
      return asset;
    } catch (failure) {
      setError((failure as Error).message);
      return null;
    } finally {
      mutations.current -= 1;
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/logout', { method: 'POST' });
      dataVersion.current += 1;
      setVerified(false);
      setShoot(undefined);
      setLast4('');
      navigatePath(root, true);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: CustomerScene) {
    const resumePage = shoot?.survey?.submittedAt
      ? 1
      : ([1, 2, 3, 4].find((page) => !shoot?.survey?.pageDone.includes(page)) ?? 4);
    navigatePath(customerPath(token, next, resumePage));
    setError('');
    setAnnouncement('');
    window.scrollTo({ top: 0 });
  }

  const onHelp = () => window.open(kakaoChannelUrl, '_blank', 'noopener,noreferrer');
  // 촬영을 불러온 분기에서만 아래 화면 props를 사용합니다.
  const viewProps = {
    shoot: shoot!,
    busy,
    onAction: perform,
    onUpload: upload,
    onNavigate: navigate,
    onHelp,
  };

  return (
    <CustomerShell
      onBack={
        verified && scene === 'home'
          ? undefined
          : () => back(scene === 'home' ? '/' : customerParent(token, scene, surveyPage))
      }
      onHome={verified ? () => navigate('home') : undefined}
      accountAction={
        verified &&
        scene === 'home' && (
          <button
            type="button"
            className={layout.accountAction}
            aria-label="안전하게 로그아웃"
            title="안전하게 로그아웃"
            disabled={busy}
            onClick={logout}
          >
            <Icon name="logout" size={16} />
          </button>
        )
      }
      step={verified ? sceneSteps[scene] : undefined}
      footer={verified && scene === 'home' ? <KakaoButton onClick={onHelp} /> : undefined}
    >
      {!verified ? (
        <section className={layout.stack}>
          <p className={layout.overline}>MY SHOOT</p>
          <h1>고객님이 맞으신가요?</h1>
          <p>사진과 개인정보를 보호하기 위해 예약하신 휴대전화 뒤 4자리를 확인할게요.</p>
          <form onSubmit={signIn} className={layout.stack}>
            <TextField
              label="휴대전화 뒤 4자리"
              autoFocus
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={last4}
              onValueChange={(value) => setLast4(value.replace(/\D/g, ''))}
              placeholder="0000"
              required
              autoComplete="off"
              className={styles.lastFour}
            />
            {error && <Notice tone="error">{error}</Notice>}
            <Button fullWidth type="submit" loading={busy} disabled={last4.length !== 4}>
              나의 촬영 확인
            </Button>
          </form>
          <p className={layout.small}>5회 연속 실패하면 10분 동안 확인이 제한됩니다.</p>
        </section>
      ) : !shoot ? (
        <Loading />
      ) : (
        <>
          {error && <Notice tone="error">{error}</Notice>}
          <span className={styles.screenReaderOnly} role="status">
            {announcement}
          </span>
          <div hidden={!['home', 'survey', 'survey-complete'].includes(scene)}>
            <SocialAccess token={token}>
              {scene === 'home' && (
                <CustomerHome shoot={shoot} onNavigate={navigate} onHelp={onHelp} />
              )}
              <Survey
                {...viewProps}
                active={scene === 'survey'}
                page={surveyPage}
                onPageChange={(page) => navigatePath(customerPath(token, 'survey', page))}
              />
              {scene === 'survey-complete' && shoot.survey?.submittedAt && (
                <SurveyComplete {...viewProps} />
              )}
            </SocialAccess>
          </div>
          {scene === 'payment' && (
            <PaymentView {...viewProps} refreshing={refreshing} onRefresh={checkStatus} />
          )}
          {scene === 'preparation' && <PreparationView {...viewProps} />}
          {scene === 'plan' && <PlanView {...viewProps} />}
          {scene === 'shoot-day' && <ShootDayView {...viewProps} />}
        </>
      )}
    </CustomerShell>
  );
}
