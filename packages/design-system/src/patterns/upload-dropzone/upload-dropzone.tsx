// 파일 선택과 끌어놓기를 받아 앱에 전달하는 공통 컴포넌트입니다.
'use client';

import { useId, useState } from 'react';
import styles from './upload-dropzone.module.css';

export type UploadDropzoneProps = {
  label: string;
  hint?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: FileList) => void;
  name?: string;
  className?: string;
};

/** File selection only. The caller owns MIME/content validation, upload, retry and permissions. */
export function UploadDropzone({
  label,
  hint,
  error,
  accept,
  multiple = true,
  disabled = false,
  onFilesSelected,
  name,
  className = '',
}: UploadDropzoneProps) {
  const fieldId = useId();
  const [dragging, setDragging] = useState(false);
  const descriptionIds =
    [hint ? `${fieldId}-hint` : undefined, error ? `${fieldId}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={styles.field}>
      <label
        className={`${styles.dropzone} ${className}`}
        data-dragging={dragging || undefined}
        data-disabled={disabled || undefined}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const files = event.dataTransfer.files;
          if (disabled || !files.length) return;
          if (multiple || files.length === 1) onFilesSelected(files);
          else {
            const selected = new DataTransfer();
            selected.items.add(files[0]);
            onFilesSelected(selected.files);
          }
        }}
      >
        <input
          className={styles.visuallyHidden}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={descriptionIds}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            if (event.currentTarget.files?.length) onFilesSelected(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
        <span className={styles.dropzoneTitle}>{label}</span>
        <span className={styles.hint}>파일 선택 또는 여기에 끌어놓기</span>
      </label>
      {hint && (
        <p id={`${fieldId}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
