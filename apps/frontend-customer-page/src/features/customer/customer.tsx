// 개인 링크 인증·촬영 조회·실제 업무 요청을 고객 원본의 개별 화면에 연결합니다.
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Loading, Notice } from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import { api, action } from '@manspick/web/client';
import type { SessionDTO, ShootDetail } from '@manspick/contracts';
import { Survey, SurveyComplete } from '../survey';
import { CustomerShell, KakaoButton } from '../shell';
import { CustomerHome } from './customer-home';
import { PhotoWorkspace } from './photo-workspace';
import { ReviewView } from './customer-scenes';
import { PreparationView, PlanView, ShootDayView } from './preparation';
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
  selection: { title: '결과물 확인', current: 6 },
  results: { title: '결과물 확인', current: 6 },
  'extra-retouch': { title: '후속 혜택', current: 7 },
  revision: { title: '결과물 확인', current: 6 },
  review: { title: '후속 혜택', current: 7 },
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
  const [helpOpen, setHelpOpen] = useState(false);
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
      setHelpOpen(false);
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

  const onHelp = () => setHelpOpen(true);
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
      onBack={() => back(scene === 'home' ? '/' : customerParent(token, scene, surveyPage))}
      onHome={verified ? () => navigate('home') : undefined}
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
          {scene === 'home' && (
            <CustomerHome shoot={viewProps.shoot} onNavigate={navigate} onHelp={onHelp} />
          )}
          {scene === 'payment' && (
            <PaymentView {...viewProps} refreshing={refreshing} onRefresh={checkStatus} />
          )}
          <Survey
            {...viewProps}
            active={scene === 'survey'}
            page={surveyPage}
            onPageChange={(page) => navigatePath(customerPath(token, 'survey', page))}
          />
          {scene === 'survey-complete' && shoot?.survey?.submittedAt && (
            <SurveyComplete {...viewProps} />
          )}
          {scene === 'preparation' && <PreparationView {...viewProps} />}
          {scene === 'plan' && <PlanView {...viewProps} />}
          {scene === 'shoot-day' && <ShootDayView {...viewProps} />}
          {(scene === 'selection' ||
            scene === 'results' ||
            scene === 'revision' ||
            scene === 'extra-retouch') && (
            <PhotoWorkspace key={scene} {...viewProps} scene={scene} />
          )}
          {scene === 'review' && <ReviewView {...viewProps} />}
        </>
      )}
      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title="촬영 준비를 도와드릴게요"
        actions={
          <>
            <Button fullWidth onClick={() => setHelpOpen(false)}>
              확인
            </Button>
            {verified && (
              <Button variant="ghost" fullWidth disabled={busy} onClick={logout}>
                안전하게 로그아웃
              </Button>
            )}
          </>
        }
      >
        <p>
          예약 상담을 진행한 카카오채널로 문의해주세요. 공식 상담 주소는 아직 등록되지 않았어요.
        </p>
      </Dialog>
    </CustomerShell>
  );
}
