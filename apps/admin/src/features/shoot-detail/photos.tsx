// 후보·보정·수정·원본 사진의 업로드와 보호된 미리보기, 업무 완료 동작을 연결합니다.
import Image from 'next/image';
import { useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import {
  Badge,
  Button,
  EmptyState,
  Notice,
  Panel,
  PhotoTile,
} from '@manspick/design-system/components';
import { SectionHeader, UploadDropzone } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { DirectorSelection } from '../director/director-selection';
import type { PerformAction } from './use-shoot-detail';
import { usePhotoUpload } from './use-photo-upload';
import { RetouchTarget, useRetouchTarget } from './retouch-target';
import styles from './shoot-detail.module.css';

type Props = {
  shoot: ShootDetail;
  role: StaffRole;
  busy: boolean;
  perform: PerformAction;
  refresh: () => Promise<void>;
  onUploadingChange: (uploading: boolean) => void;
};
const kinds = [
  ['candidate', '촬영 후보'],
  ['retouched', '보정본'],
  ['revision', '수정본'],
  ['original', '원본'],
] as const;
const kindLabels: Record<string, string> = Object.fromEntries(kinds);

export function ShootPhotos({ shoot, role, busy, perform, refresh, onUploadingChange }: Props) {
  const [kind, setKind] = useState(role === 'retoucher' ? 'retouched' : 'candidate');
  const upload = usePhotoUpload(shoot.id, refresh, onUploadingChange);
  const target = useRetouchTarget(shoot, kind);
  const disabled = busy || upload.uploading || shoot.status === 'cancelled';

  return (
    <div className={styles.stack}>
      <Panel className={styles.stack}>
        <div className={styles.sectionHeading}>
          <SectionHeader heading="h2" eyebrow="PHOTO WORKFLOW" title="사진 업로드" />
          <Badge>{role === 'retoucher' ? '배정 보정 작업' : '공개 전 인가 확인'}</Badge>
        </div>
        <label className={styles.selectField}>
          사진 종류
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            disabled={disabled}
          >
            {kinds
              .filter(
                ([value]) => role !== 'retoucher' || value === 'retouched' || value === 'revision',
              )
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </label>
        <RetouchTarget target={target} disabled={disabled} />
        <UploadDropzone
          label={upload.uploading ? '사진을 업로드하고 있습니다' : '작업할 사진을 올려주세요'}
          hint="JPEG·PNG·WebP, 장당 최대 10MB. 파일 업로드와 고객 공개는 별개입니다."
          accept="image/jpeg,image/png,image/webp"
          multiple={!target.result}
          disabled={disabled || (target.result && !target.metadata)}
          onFilesSelected={(files) => {
            void upload.upload(
              target.result ? Array.from(files).slice(0, 1) : Array.from(files),
              kind,
              target.metadata,
            );
          }}
        />
        <p className={styles.caption}>
          후보 사진은 긴 변 최대 1600px로 자동 축소합니다. 보정본·수정본은 업로드한 파일을
          유지합니다.
        </p>
        {upload.error && (
          <Notice tone="error">사진 목록을 갱신하지 못했습니다. {upload.error}</Notice>
        )}
        {upload.items.length > 0 && (
          <div className={styles.stackSmall} aria-live="polite">
            {upload.items.map((item) => (
              <div className={styles.uploadRow} key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    {kindLabels[item.kind] ?? item.kind}
                    {item.error ? ` · ${item.error}` : ''}
                  </p>
                </div>
                {item.state === 'failed' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => upload.retry(item)}
                  >
                    실패 · 재시도
                  </Button>
                ) : (
                  <Badge tone={item.state === 'done' ? 'green' : 'neutral'}>
                    {item.state === 'done' ? '완료' : '업로드 중'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
        <div className={styles.row}>
          {shoot.capabilities.includes('start_selection') && (
            <Button
              size="sm"
              disabled={disabled || !shoot.photos.some((photo) => photo.kind === 'candidate')}
              onClick={() => perform({ type: 'start_selection' })}
            >
              셀렉 열기
            </Button>
          )}
          {shoot.capabilities.includes('finish_retouch') && (
            <Button
              size="sm"
              disabled={disabled || !target.canDeliver}
              onClick={() => perform({ type: 'finish_retouch' })}
            >
              보정본 전달 완료 ({target.uploaded}/{target.required}컷)
            </Button>
          )}
        </div>
      </Panel>
      <DirectorSelection key={shoot.id} shoot={shoot} busy={disabled} perform={perform} />
      <Panel className={styles.stack}>
        <div className={styles.sectionHeading}>
          <SectionHeader heading="h3" title={`작업 사진 ${shoot.photos.length}장`} />
          <Badge>셀렉 {shoot.photos.filter((photo) => photo.selected).length}장</Badge>
        </div>
        {!shoot.photos.length ? (
          <EmptyState title="아직 작업 사진이 없습니다" />
        ) : (
          <div className={styles.photoGrid}>
            {shoot.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${photo.cutNo}번 작업 사진 크게 보기`}
              >
                <PhotoTile
                  label={`${photo.cutNo} · ${kindLabels[photo.kind] ?? photo.kind} · ${photo.visible ? '고객 공개' : '비공개'}`}
                  selected={photo.selected}
                  image={
                    <Image
                      unoptimized
                      width={600}
                      height={800}
                      src={photo.url}
                      alt={`${photo.cutNo}번 작업 사진`}
                    />
                  }
                  footer={`${photo.cutNo} · ${kindLabels[photo.kind] ?? photo.kind} · ${photo.selected ? '셀렉 · ' : ''}${photo.visible ? '공개' : '비공개'}`}
                />
              </a>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
