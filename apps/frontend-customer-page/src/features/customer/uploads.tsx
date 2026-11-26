// 공통 파일 선택 UI를 고객의 사진 업로드에 연결합니다.
import { UploadDropzone } from '@manspick/design-system/patterns';

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
