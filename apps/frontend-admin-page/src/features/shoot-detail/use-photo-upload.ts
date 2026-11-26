// 파일을 순서대로 업로드하고 실패한 파일과 종류를 보존해 재시도합니다.
'use client';

import { useState } from 'react';
import { api } from '@manspick/web/client';

type UploadItem = {
  id: string;
  name: string;
  kind: string;
  file?: File;
  state: 'uploading' | 'done' | 'failed';
  error?: string;
};

export function usePhotoUpload(
  shootId: string,
  refresh: () => Promise<void>,
  onUploadingChange: (uploading: boolean) => void,
) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  async function send(pending: UploadItem[]) {
    setUploading(true);
    onUploadingChange(true);
    setError('');
    try {
      for (const item of pending) {
        setItems((current) => [
          ...current.filter((entry) => entry.id !== item.id),
          { ...item, state: 'uploading', error: undefined },
        ]);
        try {
          const form = new FormData();
          form.set('shootId', shootId);
          form.set('kind', item.kind);
          form.set('file', item.file!);
          await api('/uploads', {
            method: 'POST',
            body: form,
            headers: { 'Idempotency-Key': item.id },
          });
          setItems((current) =>
            current.map((entry) =>
              entry.id === item.id ? { ...entry, state: 'done', file: undefined } : entry,
            ),
          );
        } catch (cause) {
          setItems((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? { ...entry, state: 'failed', error: (cause as Error).message }
                : entry,
            ),
          );
        }
      }
      await refresh();
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  async function upload(files: File[], kind: string) {
    const pending: UploadItem[] = files.map((file) => {
      return {
        id: crypto.randomUUID(),
        name: file.name,
        kind,
        file,
        state: 'uploading',
      };
    });
    setItems((current) => [...current, ...pending]);
    await send(pending);
  }

  async function retry(item: UploadItem) {
    if (item.file) await send([item]);
  }

  return { items, uploading, error, upload, retry };
}
