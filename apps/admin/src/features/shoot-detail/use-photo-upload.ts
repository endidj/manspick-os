// 파일을 순서대로 업로드하고 실패한 파일과 종류를 보존해 재시도합니다.
'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@manspick/web/client';

type UploadItem = {
  id: string;
  name: string;
  kind: string;
  file?: File;
  state: 'uploading' | 'done' | 'failed';
  error?: string;
  preview?: string;
  outfitNo?: number;
  outfitLabel?: string;
  parentPhotoId?: string;
  retouchJobId?: string;
};

export function usePhotoUpload(
  shootId: string,
  refresh: () => Promise<void>,
  onUploadingChange: (uploading: boolean) => void,
) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

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
          if (item.outfitNo) form.set('outfitNo', String(item.outfitNo));
          if (item.outfitLabel) form.set('outfitLabel', item.outfitLabel);
          if (item.parentPhotoId) form.set('parentPhotoId', item.parentPhotoId);
          if (item.retouchJobId) form.set('retouchJobId', item.retouchJobId);
          form.set(
            'file',
            item.kind === 'candidate' ? await resizeCandidate(item.file!) : item.file!,
          );
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

  async function upload(
    files: File[],
    kind: string,
    metadata: Pick<UploadItem, 'outfitNo' | 'outfitLabel' | 'parentPhotoId' | 'retouchJobId'> = {},
  ) {
    const pending: UploadItem[] = files.map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.push(preview);
      return {
        id: crypto.randomUUID(),
        name: file.name,
        kind,
        ...metadata,
        file,
        preview,
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

async function resizeCandidate(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('사진을 축소하지 못했습니다. 다시 시도해주세요.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('사진을 변환하지 못했습니다.'))),
        'image/jpeg',
        0.88,
      ),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } finally {
    bitmap.close();
  }
}
