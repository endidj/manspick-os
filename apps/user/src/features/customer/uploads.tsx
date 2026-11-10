// 공통 파일 선택 UI를 고객 업로드와 보호된 다운로드 링크에 연결합니다.
import { UploadDropzone } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';
import styles from './customer.module.css';

export function UploadButton({
  onFile,
  busy,
  label,
}: {
  onFile: (file: File) => Promise<unknown>;
  busy: boolean;
  label: string;
}) {
  return (
    <UploadDropzone
      label={busy ? '올리는 중…' : label}
      hint="JPEG·PNG·WebP · 최대 10MB"
      accept="image/jpeg,image/png,image/webp"
      multiple={false}
      disabled={busy}
      onFilesSelected={(files) => {
        if (files[0]) void onFile(files[0]);
      }}
    />
  );
}

export function UploadList({ items }: { items: { id: string; url: string; name: string }[] }) {
  return (
    <ul className={styles.fileList}>
      {items.map((item) => (
        <li key={item.id}>
          <a href={item.url} target="_blank" rel="noreferrer">
            <span>{item.name}</span>
            <Icon name="solar/download-bold" size={16} />
          </a>
        </li>
      ))}
    </ul>
  );
}
