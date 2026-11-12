// 개인 링크 인증·촬영 조회·실제 업무 요청을 고객 원본의 개별 화면에 연결합니다.
'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [scene, setScene] = useState<CustomerScene>('home');
  const [helpOpen, setHelpOpen] = useState(false);
  const refresh = useCallback(async (id: string) => {
    setShoot(await api<ShootDetail>(`/shoots/${id}`));
  }, []);

  useEffect(() => {
    if (!verified || !shootId || scene !== 'shoot-day' || busy) return;
    const timer = setInterval(() => {
      void refresh(shootId).catch((failure: Error) => setError(failure.message));
    }, 15000);
    return () => clearInterval(timer);
  }, [verified, shootId, scene, busy, refresh]);

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
      if (!quiet) setBusy(false);
    }
  }

  async function upload(file: File, kind: string) {
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
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/logout', { method: 'POST' });
      setVerified(false);
      setShoot(undefined);
      setLast4('');
      setScene('home');
      setHelpOpen(false);
    } catch (failure) {
      setError((failure as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function navigate(next: CustomerScene) {
    setScene(next);
    setError('');
    setAnnouncement('');
    window.scrollTo({ top: 0 });
  }

  const onHelp = () => setHelpOpen(true);
  const viewProps = shoot
    ? { shoot, busy, onAction: perform, onUpload: upload, onNavigate: navigate, onHelp }
    : null;

  return (
    <CustomerShell
      onHome={verified ? () => navigate('home') : undefined}
      onHelp={onHelp}
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
      ) : !viewProps ? (
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
          {scene === 'payment' && <PaymentView {...viewProps} />}
          {scene === 'survey' && <Survey {...viewProps} />}
          {scene === 'survey-complete' && <SurveyComplete {...viewProps} />}
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
