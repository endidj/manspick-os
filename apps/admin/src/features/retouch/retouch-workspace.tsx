// 실제 배정 작업 목록과 개인정보가 제한된 보정 작업 상세를 연결합니다.
import Image from 'next/image';
import { useState } from 'react';
import {
  Badge,
  Button,
  EmptyState,
  Loading,
  Notice,
  Panel,
  PhotoTile,
} from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { Dialog, UploadDropzone } from '@manspick/design-system/patterns';
import type { StaffRole } from '@manspick/domain';
import type { ShootDetail, ShootSummary } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import { PageHeading } from '../workspace/page-heading';
import { useShootDetail, type PerformAction } from '../shoot-detail/use-shoot-detail';
import { usePhotoUpload } from '../shoot-detail/use-photo-upload';
import { RetouchTarget, useRetouchTarget } from '../shoot-detail/retouch-target';
import { ShootRequests } from '../shoot-detail/requests';
import styles from './retouch.module.css';

export function RetouchWorkspace({
  shoots,
  completed = false,
  role,
}: {
  shoots: ShootSummary[];
  completed?: boolean;
  role: StaffRole;
}) {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<string>();
  const items = shoots.filter((s) =>
    completed
      ? [
          'delivered',
          'review_requested',
          'review_pending',
          'review_confirmed',
          'originals_pending',
          'originals_delivered',
          'follow_up',
        ].includes(s.status)
      : Boolean(s.retoucherName) && !['delivered', 'follow_up', 'cancelled'].includes(s.status),
  );
  const visible = items.filter(
    (s) =>
      filter === 'all' ||
      (filter === 'new' && s.status === 'retouch_assigned') ||
      (filter === 'working' && s.status === 'retouching') ||
      (filter === 'revision' && s.pendingRequests > 0),
  );
  const current = items.find((s) => s.id === selected) ?? visible[0];
  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="RETOUCHER · 4-2"
        title={current ? `작업 #${current.id}` : completed ? '완료 내역' : '내 보정 작업'}
        description={
          current
            ? `${current.packageName} · 촬영 ${dateTime(current.startsAt)} · 담당 디렉터 ${current.directorName ?? '미배정'}`
            : '본인에게 배정된 작업만 표시합니다.'
        }
      />
      <Notice tone="success">
        <Icon name="shield" size={18} /> 개인정보 최소 노출 — 보정가에게는 셀렉 컷 · 요청사항 · 보정
        선호도만 보입니다. 이름 · 연락처 · 설문 상세는 표시되지 않습니다.
      </Notice>
      <div className={styles.layout}>
        <aside>
          <div className={styles.filters}>
            {[
              ['all', '전체'],
              ['new', '신규'],
              ['working', '보정 중'],
              ['revision', '수정 요청'],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                data-active={filter === id}
                onClick={() => setFilter(id)}
              >
                {label}{' '}
                {
                  items.filter(
                    (s) =>
                      id === 'all' ||
                      (id === 'new' && s.status === 'retouch_assigned') ||
                      (id === 'working' && s.status === 'retouching') ||
                      (id === 'revision' && s.pendingRequests > 0),
                  ).length
                }
              </button>
            ))}
          </div>
          <div className={styles.jobs}>
            {visible.map((shoot) => (
              <button
                key={shoot.id}
                type="button"
                className={styles.job}
                data-active={current?.id === shoot.id}
                onClick={() => setSelected(shoot.id)}
              >
                <strong>#{shoot.id}</strong>
                <span>{shoot.statusLabel}</span>
                <small>마감 {dateTime(shoot.retouchDueAt)}</small>
              </button>
            ))}
          </div>
        </aside>
        <div>
          {current ? (
            <RetouchLoader key={current.id} id={current.id} role={role} />
          ) : (
            <EmptyState title="배정된 작업이 없습니다" />
          )}
        </div>
      </div>
    </div>
  );
}

function RetouchLoader({ id, role }: { id: string; role: StaffRole }) {
  const { shoot, busy, error, success, perform, refresh, reload } = useShootDetail(id);
  return (
    <div className={styles.screen}>
      {error && (
        <Notice tone="error">
          {error}
          <Button size="sm" variant="ghost" onClick={reload}>
            다시 불러오기
          </Button>
        </Notice>
      )}
      {success && <Notice tone="success">{success}</Notice>}
      {shoot ? (
        <RetouchDetail shoot={shoot} busy={busy} perform={perform} refresh={refresh} role={role} />
      ) : (
        !error && <Loading />
      )}
    </div>
  );
}

export function RetouchDetail({
  shoot,
  busy,
  perform,
  refresh,
  role,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
  refresh: () => Promise<void>;
  role: StaffRole;
}) {
  const [requests, setRequests] = useState(false);
  const [kind, setKind] = useState('retouched');
  const upload = usePhotoUpload(shoot.id, refresh, () => {});
  const target = useRetouchTarget(shoot, kind);
  const selected = shoot.photos.filter((photo) => photo.selected);
  const locked = busy || upload.uploading || shoot.status === 'cancelled';
  const strength = shoot.survey?.answers.retouchStrength;
  return (
    <div className={styles.screen}>
      <Panel className={styles.panel}>
        <div className={styles.sectionHeading}>
          <h2>
            <Icon name="image" size={18} />
            셀렉 컷 {selected.length}장
          </h2>
          <span>보호된 사진 저장소</span>
        </div>
        <div className={styles.photos}>
          {selected.map((photo) => (
            <a href={photo.url} target="_blank" rel="noreferrer" key={photo.id}>
              <PhotoTile
                label={`셀렉 컷 ${photo.cutNo}`}
                image={
                  <Image
                    src={photo.url}
                    alt={`셀렉 컷 ${photo.cutNo}`}
                    width={160}
                    height={200}
                    unoptimized
                  />
                }
              />
              <span>
                #{String(photo.cutNo).padStart(2, '0')}
                {shoot.requests.some((r) => r.items.some((i) => i.photoId === photo.id))
                  ? ' · 요청 ●'
                  : ''}
              </span>
            </a>
          ))}
        </div>
        {!selected.length && <EmptyState title="셀렉이 완료된 사진이 없습니다" />}
      </Panel>
      <div className={styles.columns}>
        <Panel className={styles.panel}>
          <h2>
            <Icon name="chat" size={18} />
            요청사항
          </h2>
          {shoot.requests
            .filter((r) => r.type === 'revision')
            .map((request) => (
              <div className={styles.request} key={request.id}>
                <span>고객 · {request.state}</span>
                {request.message && <p>{request.message}</p>}
                {request.items.map((item, index) => (
                  <p key={index}>
                    #{shoot.photos.find((p) => p.id === item.photoId)?.cutNo ?? '—'}: {item.comment}
                  </p>
                ))}
              </div>
            ))}
          {!shoot.requests.some((r) => r.type === 'revision') && (
            <p className={styles.muted}>접수된 수정 요청이 없습니다.</p>
          )}
        </Panel>
        <Panel className={styles.panel}>
          <h2>
            <Icon name="solar/magic-stick-3-bold" size={18} />
            보정 선호도
          </h2>
          <div className={styles.preference}>
            <span>피부 보정</span>
            <strong>
              {strength === undefined ? '미입력' : `${String(strength)}% · 자연스럽게`}
            </strong>
          </div>
          <div className={styles.strength} aria-label={`보정 강도 ${strength ?? '미입력'}`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                data-active={typeof strength === 'number' && i < Math.round(strength / 20)}
              />
            ))}
          </div>
          <p className={styles.muted}>고객이 제출한 보정 강도만 표시합니다.</p>
          {role !== 'retoucher' && shoot.plan?.note && (
            <p className={styles.request}>{shoot.plan.note}</p>
          )}
        </Panel>
      </div>
      <Panel className={styles.panel}>
        <div className={styles.sectionHeading}>
          <h2>
            <Icon name="download" size={18} />
            보정본 올리기
          </h2>
          <span>OS에 업로드 · 고객 화면에 공개</span>
        </div>
        <div className={styles.uploadTools}>
          <label>
            작업 종류
            <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={locked}>
              <option value="retouched">보정본</option>
              <option value="revision">수정본</option>
            </select>
          </label>
          <RetouchTarget target={target} disabled={locked} />
        </div>
        <div className={styles.uploadRow}>
          <UploadDropzone
            label="선택한 컷의 결과 파일 올리기"
            hint="JPEG·PNG·WebP · 보정 결과의 원본 크기를 보존합니다."
            accept="image/jpeg,image/png,image/webp"
            disabled={locked || !target.metadata}
            onFilesSelected={(files) =>
              void upload.upload(Array.from(files).slice(0, 1), kind, target.metadata)
            }
          />
          <Button variant="secondary" onClick={() => setRequests(true)}>
            수정 요청 보기
          </Button>
          <Button
            disabled={
              locked || !target.canDeliver || !shoot.capabilities.includes('finish_retouch')
            }
            loading={busy}
            onClick={() => perform({ type: 'finish_retouch' })}
          >
            결과 전달 ({target.uploaded}/{target.required}컷)
          </Button>
        </div>
        {upload.error && <Notice tone="error">{upload.error}</Notice>}
        {upload.items.map((item) => (
          <div key={item.id} className={styles.uploadState}>
            <span>{item.name}</span>
            {item.state === 'failed' ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={locked}
                onClick={() => upload.retry(item)}
              >
                실패 · 재시도
              </Button>
            ) : (
              <Badge tone={item.state === 'done' ? 'green' : 'neutral'}>
                {item.state === 'done' ? '업로드 완료' : '업로드 중'}
              </Badge>
            )}
          </div>
        ))}
        <p className={styles.muted}>
          보정본 업로드 후 전달 완료를 누릅니다. 수정 요청은 사진별 의견과 함께 표시됩니다 (최대
          3회).
        </p>
      </Panel>
      <Dialog open={requests} onOpenChange={setRequests} title="사진별 수정 요청">
        <ShootRequests shoot={shoot} busy={locked} perform={perform} />
      </Dialog>
    </div>
  );
}
