// 운영자가 새 고객 접속 링크를 발급하고 복사하는 화면입니다.
import { useState } from 'react';
import { Button, Notice } from '@manspick/design-system/components';
import { Dialog, TextField } from '@manspick/design-system/patterns';
import { api } from '@manspick/web/client';

export function CustomerLink({ shootId }: { shootId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function issue() {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ url: string; recipientPhone: string }>(
        `/auth/customer-link/${encodeURIComponent(shootId)}`,
        { method: 'POST' },
      );
      setUrl(result.url);
      setRecipientPhone(result.recipientPhone);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setUrl('');
          setError('');
          setCopied(false);
          setOpen(true);
        }}
      >
        고객 접속 링크
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!busy) {
            setOpen(next);
            if (!next) {
              setUrl('');
              setRecipientPhone('');
            }
          }
        }}
        title="고객 접속 링크 발급"
      >
        {url ? (
          <>
            <Notice tone="success">본인 확인을 마친 고객에게 링크를 전달해주세요.</Notice>
            <TextField
              label="등록된 연락처"
              readOnly
              value={recipientPhone}
              onValueChange={() => {}}
            />
            <TextField label="고객 접속 링크" readOnly value={url} onValueChange={() => {}} />
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                } catch {
                  setError('링크 입력란에서 직접 복사해주세요.');
                }
              }}
            >
              {copied ? '복사 완료' : '링크 복사'}
            </Button>
          </>
        ) : (
          <>
            <p>
              새 링크를 만들면 이전 링크와 고객 로그인 세션이 모두 만료됩니다. 링크와 등록 연락처
              확인은 이력에 남습니다.
            </p>
            <Button loading={busy} disabled={busy} onClick={() => void issue()}>
              새 링크 발급
            </Button>
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
      </Dialog>
    </>
  );
}
