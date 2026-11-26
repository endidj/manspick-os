// 관리자만 예약에 내부 사진을 보관하고 업로드 결과와 재시도를 확인합니다.
import Image from 'next/image';
import type { ShootDetail } from '@manspick/contracts';
import { Button, Notice, Panel } from '@manspick/design-system/components';
import { UploadDropzone } from '@manspick/design-system/patterns';
import { dateTime } from '@manspick/web/format';
import { usePhotoUpload } from './use-photo-upload';
import styles from './shoot-detail.module.css';

export function InternalPhotos({
  shoot,
  busy,
  refresh,
  onUploadingChange,
}: {
  shoot: ShootDetail;
  busy: boolean;
  refresh: () => Promise<void>;
  onUploadingChange: (value: boolean) => void;
}) {
  const uploader = usePhotoUpload(shoot.id, refresh, onUploadingChange);
  const photos = shoot.uploads.filter((file) => file.kind === 'internal_photo');
  return (
    <Panel className={styles.stackSmall}>
      <h2>예약 내부 사진</h2>
      <UploadDropzone
        label="내부 사진 추가"
        multiple
        accept="image/jpeg,image/png,image/webp"
        disabled={busy || uploader.uploading}
        onFilesSelected={(files) => void uploader.upload(Array.from(files), 'internal_photo')}
      />
      {uploader.error && <Notice tone="error">{uploader.error}</Notice>}
      {uploader.items
        .filter((item) => item.state !== 'done')
        .map((item) => (
          <div key={item.id} role="status">
            {item.name} · {item.error || '업로드 중'}{' '}
            {item.state === 'failed' && (
              <Button
                disabled={busy || uploader.uploading}
                onClick={() => void uploader.retry(item)}
              >
                다시 시도
              </Button>
            )}
          </div>
        ))}
      {photos.length ? (
        <ul>
          {photos.map((photo) => (
            <li key={photo.id}>
              <a href={photo.url} target="_blank" rel="noreferrer">
                <Image src={photo.url} alt="" width={96} height={96} unoptimized /> {photo.name}
              </a>{' '}
              · {photo.uploadedByName ?? '기록된 직원 없음'} · {dateTime(photo.createdAt)}
            </li>
          ))}
        </ul>
      ) : (
        <p>등록된 사진이 없습니다.</p>
      )}
    </Panel>
  );
}
