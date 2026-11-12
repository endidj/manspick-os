// 두 보정 업로드 화면에서 같은 작업 컷과 전달 가능 여부를 사용합니다.
import { useState } from 'react';
import type { ShootDetail } from '@manspick/contracts';
import { SelectField } from '@manspick/design-system/patterns';

const jobLabels: Record<string, string> = {
  base: '기본 보정',
  extra: '추가 보정',
  revision: '수정 요청',
};

export function useRetouchTarget(shoot: ShootDetail, kind: string) {
  const [key, setKey] = useState('');
  const pending = shoot.retouchJobs.filter((job) => job.state !== 'complete');
  const jobs = pending.filter(
    (job) => (job.kind === 'revision' ? 'revision' : 'retouched') === kind,
  );
  const result = kind === 'retouched' || kind === 'revision';
  const photos = new Map(shoot.photos.map((photo) => [photo.id, photo]));
  const options = jobs.flatMap((job) =>
    job.cuts.flatMap((cut) => {
      const photo = photos.get(cut.photoId);
      if (!photo) return [];
      return [
        {
          key: `${job.id}/${cut.photoId}`,
          label: `${jobLabels[job.kind] ?? '보정'} · ${photo.cutNo}번 컷${cut.uploaded ? ' (올림 · 다시 올리면 교체)' : ''}`,
          metadata: { retouchJobId: job.id, parentPhotoId: cut.photoId },
        },
      ];
    }),
  );
  const selected =
    options.find((option) => option.key === key) ?? (options.length === 1 ? options[0] : undefined);
  const required = pending.reduce((total, job) => total + job.cuts.length, 0);
  const uploaded = pending.reduce(
    (total, job) => total + job.cuts.filter((cut) => cut.uploaded).length,
    0,
  );
  return {
    options,
    setKey,
    key: selected?.key ?? '',
    metadata: selected?.metadata,
    result,
    required,
    uploaded,
    canDeliver:
      pending.length > 0 &&
      pending.every((job) => job.cuts.length > 0 && job.cuts.every((cut) => cut.uploaded)),
  };
}

export function RetouchTarget({
  target,
  disabled,
}: {
  target: ReturnType<typeof useRetouchTarget>;
  disabled: boolean;
}) {
  if (!target.result) return null;
  return (
    <SelectField
      label="연결할 작업 컷"
      value={target.key}
      onValueChange={target.setKey}
      disabled={disabled || !target.options.length}
      options={[
        {
          value: '',
          label: target.options.length
            ? '요청 컷 선택'
            : '해당 종류의 진행 중인 작업 컷이 없습니다',
        },
        ...target.options.map((option) => ({ value: option.key, label: option.label })),
      ]}
    />
  );
}
