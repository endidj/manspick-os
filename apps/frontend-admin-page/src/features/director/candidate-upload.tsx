// 촬영 후보를 의상별로 업로드·공개하고 현장 확정에 따라 디렉터 최종 셀렉으로 이어갑니다.
import Image from 'next/image';
import { useState } from 'react';
import { Button, Notice, PhotoTile } from '@manspick/design-system/components';
import { RadioPills, UploadDropzone } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { usePhotoUpload } from '../shoot-detail/use-photo-upload';
import type { PerformAction } from '../shoot-detail/use-shoot-detail';
import { shootHref } from '../workspace/model';
import { MobileHeader } from './mobile-header';
import { DirectorSelection } from './director-selection';
import styles from './director.module.css';

export function CandidateUpload({
  shoot,
  busy,
  perform,
  refresh,
  onUploadingChange,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
  refresh: () => Promise<void>;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const upload = usePhotoUpload(shoot.id, refresh, onUploadingChange);
  const [outfitNo, setOutfitNo] = useState(1);
  const [filter, setFilter] = useState(0);
  const [workspace, setWorkspace] = useState(() =>
    shoot.selectionMode === 'director' &&
    (shoot.status === 'selection_pending' ||
      shoot.selections.some((selection) => selection.round === 'base'))
      ? 'selection'
      : 'upload',
  );
  const candidates = shoot.photos.filter((p) => p.kind === 'candidate');
  const visible = filter ? candidates.filter((photo) => photo.outfitNo === filter) : candidates;
  const failed = upload.items.filter((item) => item.state === 'failed');
  const completed = upload.items.filter((item) => item.state === 'done').length;
  const locked = busy || upload.uploading || shoot.status === 'cancelled';
  const submitted = shoot.selections.some((selection) => selection.round === 'base');
  const directorSelecting = shoot.selectionMode === 'director';
  return (
    <div className={styles.mobile}>
      <MobileHeader
        title={
          directorSelecting && workspace === 'selection' ? '디렉터 최종 셀렉' : '후보 사진 올리기'
        }
        subtitle={`DIRECTOR · 3-4 · ${shoot.customerName}`}
        back={shootHref(shoot.id, 'manage')}
      />
      {directorSelecting && (
        <RadioPills
          label="후보 사진 업무"
          value={workspace}
          disabled={locked}
          onValueChange={setWorkspace}
          options={[
            { value: 'upload', label: '후보 업로드·공개' },
            { value: 'selection', label: submitted ? '최종 셀렉 확인' : '디렉터 최종 셀렉' },
          ]}
        />
      )}
      {directorSelecting && (
        <div hidden={workspace !== 'selection'}>
          <DirectorSelection key={shoot.id} shoot={shoot} busy={locked} perform={perform} />
        </div>
      )}
      <div
        className={styles.uploadWorkspace}
        hidden={directorSelecting && workspace === 'selection'}
      >
        <section className={styles.uploadIntro}>
          <span>촬영 직후 · 핸드폰에서</span>
          <h1>후보 40~50장을 올려주세요</h1>
          <p>
            사진첩에서 여러 장을 한 번에 고르면 자동으로 줄여서 올라가요. 올리고 ‘셀렉 열기’를
            누르면 고객 화면에 보여요.
          </p>
          <div className={styles.filters}>
            <span>
              {' '}
              {shoot.selectionMode === 'director' ? '디렉터' : '고객'} 셀렉 · 보정{' '}
              {shoot.package.retouchCount}장
            </span>
            <span>보호된 사진 저장소</span>
          </div>
        </section>
        <label className={styles.outfitSelect}>
          업로드할 의상
          <select
            value={outfitNo}
            disabled={locked}
            onChange={(event) => setOutfitNo(Number(event.target.value))}
          >
            {Array.from({ length: shoot.package.outfits }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                의상 {index + 1}
              </option>
            ))}
          </select>
        </label>
        <UploadDropzone
          label="사진첩에서 후보 사진 고르기"
          hint="JPEG·PNG·WebP · 긴 변 최대 1600px로 자동 축소"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={locked}
          onFilesSelected={(files) =>
            void upload.upload(Array.from(files), 'candidate', {
              outfitNo,
              outfitLabel: `의상 ${outfitNo}`,
            })
          }
        />
        {upload.error && (
          <Notice tone="error">사진 목록을 갱신하지 못했습니다. {upload.error}</Notice>
        )}
        <div className={styles.filters}>
          <button type="button" data-active={!filter} onClick={() => setFilter(0)}>
            전체 {candidates.length}
          </button>
          {Array.from({ length: shoot.package.outfits }, (_, index) => (
            <button
              type="button"
              key={index + 1}
              data-active={filter === index + 1}
              onClick={() => setFilter(index + 1)}
            >
              의상 {index + 1} · {candidates.filter((photo) => photo.outfitNo === index + 1).length}
            </button>
          ))}
        </div>
        <div className={styles.candidateGrid}>
          {visible.map((photo) => (
            <a href={photo.url} key={photo.id} target="_blank" rel="noreferrer">
              <PhotoTile
                label={`후보 ${photo.cutNo}`}
                image={
                  <Image
                    src={photo.url}
                    alt={`후보 ${photo.cutNo}`}
                    width={220}
                    height={280}
                    unoptimized
                  />
                }
              />
            </a>
          ))}
          {upload.items
            .filter((item) => item.state !== 'done' && (!filter || item.outfitNo === filter))
            .map((item) => (
              <button
                type="button"
                key={item.id}
                disabled={locked || item.state !== 'failed'}
                data-failed={item.state === 'failed' || undefined}
                onClick={() => void upload.retry(item)}
                className={styles.uploadTile}
              >
                {item.preview && (
                  <Image src={item.preview} alt={item.name} fill unoptimized sizes="110px" />
                )}
                <span>{item.state === 'failed' ? '실패 · 다시 시도' : '업로드 중'}</span>
                {item.error && <small>{item.error}</small>}
              </button>
            ))}
        </div>
        <div className={styles.sticky}>
          <div className={styles.progressHeading}>
            <span>
              <strong>{completed}</strong> / {upload.items.length}장 업로드
            </span>
            <span>{failed.length ? `${failed.length}장 실패` : ''}</span>
          </div>
          {upload.items.length > 0 && (
            <progress className={styles.progress} max={upload.items.length} value={completed} />
          )}
          {failed.length > 0 && (
            <Button
              variant="secondary"
              disabled={locked}
              onClick={async () => {
                for (const item of failed) await upload.retry(item);
              }}
            >
              실패한 사진 다시 시도
            </Button>
          )}
          <Button
            disabled={
              locked ||
              submitted ||
              failed.length > 0 ||
              !candidates.length ||
              !shoot.capabilities.includes('start_selection')
            }
            loading={busy}
            onClick={async () => {
              if (await perform({ type: 'start_selection' })) {
                if (directorSelecting) setWorkspace('selection');
              }
            }}
          >
            {submitted
              ? '최종 셀렉 제출 완료'
              : `${directorSelecting ? '후보 공개 후 디렉터 셀렉' : '고객에게 셀렉 열기'} (${candidates.length}장)`}
          </Button>
          <p>후보 업로드와 고객 공개는 별개입니다.</p>
        </div>
      </div>
    </div>
  );
}
