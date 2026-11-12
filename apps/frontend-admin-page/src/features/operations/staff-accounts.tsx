// 관리자 설정에서 직원 계정을 등록하고 역할·활성 상태·로그인 세션을 관리합니다.
import { useEffect, useId, useState } from 'react';
import type { StaffAccountDTO } from '@manspick/contracts';
import type { StaffRole } from '@manspick/domain';
import { Button, Loading, Notice, Panel, Switch } from '@manspick/design-system/components';
import { Dialog, SelectField, SettingRow, TextField } from '@manspick/design-system/patterns';
import { api, ApiError } from '@manspick/web/client';
import { roles } from '../workspace/model';
import styles from './management.module.css';

type Draft =
  | { kind: 'create'; name: string; email: string; role: StaffRole }
  | { kind: 'edit'; account: StaffAccountDTO; role: StaffRole; active: boolean }
  | { kind: 'revoke'; account: StaffAccountDTO };

const roleOptions = roles.map(({ id, label }) => ({ value: id, label }));

export function StaffAccounts({ actorId }: { actorId: string }) {
  const formId = useId();
  const [accounts, setAccounts] = useState<StaffAccountDTO[]>();
  const [revision, setRevision] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState<ApiError | Error>();
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Draft>();

  useEffect(() => {
    const controller = new AbortController();
    api<StaffAccountDTO[]>('/staff', { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setAccounts(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setLoadError((cause as Error).message);
      });
    return () => controller.abort();
  }, [revision]);

  function reload() {
    setDraft(undefined);
    setSaveError(undefined);
    setLoadError('');
    setAccounts(undefined);
    setRevision((previous) => previous + 1);
  }

  function open(next: Draft) {
    setSaveError(undefined);
    setFeedback('');
    setDraft(next);
  }

  async function submit() {
    if (!draft || busy) return;
    setBusy(true);
    setSaveError(undefined);
    const path =
      draft.kind === 'create' ? '/staff' : `/staff/${encodeURIComponent(draft.account.id)}`;
    try {
      const body =
        draft.kind === 'create'
          ? { name: draft.name, email: draft.email, role: draft.role }
          : draft.kind === 'edit'
            ? { role: draft.role, active: draft.active, version: draft.account.version }
            : { version: draft.account.version };
      const saved = await api<StaffAccountDTO>(
        draft.kind === 'revoke' ? `${path}/revoke-sessions` : path,
        { method: 'POST', body: JSON.stringify(body) },
      );
      setAccounts((current = []) =>
        draft.kind === 'create'
          ? [...current, saved]
          : current.map((account) => (account.id === saved.id ? saved : account)),
      );
      setFeedback(
        draft.kind === 'revoke'
          ? '이 계정의 모든 로그인 세션을 종료했습니다.'
          : '직원 계정을 저장했습니다.',
      );
      setDraft(undefined);
    } catch (cause) {
      setSaveError(cause as Error);
    } finally {
      setBusy(false);
    }
  }

  const title =
    draft?.kind === 'create'
      ? '직원 계정 등록'
      : draft?.kind === 'revoke'
        ? '모든 세션 종료'
        : '직원 계정 편집';
  const conflict =
    draft?.kind !== 'create' && saveError instanceof ApiError && saveError.status === 409;

  return (
    <div className={styles.form}>
      <div className={styles.cardHeading}>
        <h2>직원 계정</h2>
        <Button
          size="sm"
          disabled={!accounts || busy}
          onClick={() => open({ kind: 'create', name: '', email: '', role: 'staff' })}
        >
          직원 추가
        </Button>
      </div>
      {loadError && (
        <Notice tone="error">
          {loadError}{' '}
          <Button size="sm" variant="ghost" onClick={reload}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {feedback && <Notice tone="success">{feedback}</Notice>}
      {!draft && saveError && <Notice tone="error">{saveError.message}</Notice>}
      {accounts?.length ? (
        <Panel role="list" aria-label="직원 계정 목록">
          {accounts.map((account) => (
            <SettingRow
              role="listitem"
              key={account.id}
              label={account.name}
              description={account.email}
              value={`${roleOptions.find(({ value }) => value === account.role)?.label} · ${account.active ? '활성' : '비활성'}`}
              actions={
                account.id === actorId ? (
                  '내 계정'
                ) : (
                  <div className={styles.inlineActions}>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`${account.name} 편집`}
                      disabled={busy}
                      onClick={() =>
                        open({ kind: 'edit', account, role: account.role, active: account.active })
                      }
                    >
                      편집
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`${account.name} 모든 세션 종료`}
                      disabled={busy}
                      onClick={() => open({ kind: 'revoke', account })}
                    >
                      세션 종료
                    </Button>
                  </div>
                )
              }
            />
          ))}
        </Panel>
      ) : accounts ? (
        <Notice>등록된 직원이 없습니다.</Notice>
      ) : (
        !loadError && <Loading />
      )}
      <Dialog
        open={Boolean(draft)}
        onOpenChange={(next) => {
          if (!next) {
            setSaveError(undefined);
            setDraft(undefined);
          }
        }}
        title={title}
        description={draft && draft.kind !== 'create' ? draft.account.name : undefined}
        actions={
          conflict ? (
            <Button type="button" variant="secondary" onClick={reload}>
              최신 상태 불러오기
            </Button>
          ) : (
            <Button
              type="submit"
              form={formId}
              variant={draft?.kind === 'revoke' ? 'danger' : 'primary'}
              loading={busy}
            >
              {draft?.kind === 'revoke' ? '모든 세션 종료' : '계정 저장'}
            </Button>
          )
        }
      >
        {draft && (
          <form
            id={formId}
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              if (!conflict) void submit();
            }}
          >
            {draft.kind === 'create' && (
              <>
                <TextField
                  label="이름"
                  value={draft.name}
                  required
                  disabled={busy}
                  onValueChange={(name) => setDraft({ ...draft, name })}
                />
                <TextField
                  label="회사 이메일"
                  type="email"
                  value={draft.email}
                  required
                  maxLength={254}
                  disabled={busy}
                  onValueChange={(email) => setDraft({ ...draft, email })}
                />
              </>
            )}
            {draft.kind !== 'revoke' && (
              <SelectField
                label="역할"
                value={draft.role}
                options={roleOptions}
                disabled={busy}
                onValueChange={(role) => setDraft({ ...draft, role: role as StaffRole })}
              />
            )}
            {draft.kind === 'edit' && (
              <>
                <Switch
                  label="계정 활성"
                  checked={draft.active}
                  disabled={busy}
                  onCheckedChange={(active) => setDraft({ ...draft, active })}
                />
                <Notice>역할 또는 상태를 바꾸면 기존 세션과 로그인 링크가 만료됩니다.</Notice>
              </>
            )}
            {draft.kind === 'revoke' && (
              <Notice tone="warning">
                모든 기기에서 로그아웃되고 기존 로그인 링크도 사용할 수 없게 됩니다.
              </Notice>
            )}
            {saveError && <Notice tone="error">{saveError.message}</Notice>}
          </form>
        )}
      </Dialog>
    </div>
  );
}
