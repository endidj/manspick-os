// 고객 상세와 디렉터 현장 업무를 역할별로 연결합니다.
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { type StaffRole, STAGE_LABELS } from '@manspick/domain';
import { Badge, Button, Loading, Notice, StageBadge } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { dateTime } from '@manspick/web/format';
import { CustomerManage, FieldChecklist } from '../director';
import { detailScreen } from '../workspace/model';
import { StatusDialog } from './status-dialog';
import { AssignmentDialog } from './assignment-dialog';
import { ShootOverview } from './overview';
import { InternalPhotos } from './internal-photos';
import { ShootRequests } from './requests';
import { ShootSurvey } from './survey';
import { ShootTimeline } from './timeline';
import { useShootDetail } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

function subscribeLocation(callback: () => void) {
  window.addEventListener('popstate', callback);
  return () => window.removeEventListener('popstate', callback);
}

function readScreen() {
  return new URLSearchParams(window.location.search).get('screen');
}

function serverScreen() {
  return null;
}

export function ShootDetailScreen({ shootId, role }: { shootId: string; role: StaffRole }) {
  const { shoot, busy, loading, error, success, perform, reload, refresh } =
    useShootDetail(shootId);
  const [tab, setTab] = useState('overview');
  const screen = detailScreen(
    useSyncExternalStore(subscribeLocation, readScreen, serverScreen),
    role,
  );
  const [uploading, setUploading] = useState(false);
  const locked = busy || uploading;
  return (
    <div className={styles.stack}>
      {error && <Notice tone="error">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      {!shoot ? (
        error ? (
          <Button variant="secondary" loading={loading} onClick={reload}>
            촬영 다시 불러오기
          </Button>
        ) : (
          <Loading />
        )
      ) : role === 'director' ? (
        screen === 'field' ? (
          <FieldChecklist shoot={shoot} busy={locked} perform={perform} />
        ) : (
          <CustomerManage shoot={shoot} busy={locked} perform={perform} />
        )
      ) : (
        <>
          <Link href="/?view=board" className={styles.back}>
            고객 보드 / {shoot.customerName}
          </Link>
          <header className={styles.detailHeading}>
            <div className={styles.stackSmall}>
              <div className={styles.row}>
                <h1>{shoot.customerName}</h1>
                {shoot.stage > 0 ? (
                  <StageBadge
                    stage={shoot.stage as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                    label={STAGE_LABELS[shoot.stage - 1]!}
                  />
                ) : (
                  <Badge>취소</Badge>
                )}
                <Badge tone="blue">{shoot.statusLabel}</Badge>
              </div>
              <p className={styles.detailSubtitle}>
                {shoot.packageName}
                {shoot.addons.map((addon) => ` + ${addon.name}`).join('')} ·{' '}
                {dateTime(shoot.startsAt)} · 디렉터 {shoot.directorName ?? '미배정'}
              </p>
            </div>
            <div className={styles.headerActions}>
              <StatusDialog shoot={shoot} busy={locked} perform={perform} />
              <AssignmentDialog shoot={shoot} busy={locked} perform={perform} />
              <Button
                variant="kakao"
                disabled
                title="정식 카카오 채널 주소가 등록되지 않았습니다"
                leadingIcon={<Icon name="ri/kakao-talk-fill" size={18} />}
              >
                카카오채널 열기
              </Button>
            </div>
          </header>
          {tab === 'overview' ? (
            <ShootOverview
              shoot={shoot}
              role={role}
              busy={locked}
              perform={perform}
              onTabChange={setTab}
            />
          ) : (
            <>
              <div className={styles.row}>
                <Button size="sm" variant="secondary" onClick={() => setTab('overview')}>
                  ← 고객 상세
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTab('survey')}>
                  설문
                </Button>
                {role === 'admin' && (
                  <Button size="sm" variant="ghost" onClick={() => setTab('photos')}>
                    예약 내부 사진
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setTab('requests')}>
                  요청
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setTab('timeline')}>
                  타임라인
                </Button>
                <Button size="sm" variant="ghost" loading={loading} onClick={reload}>
                  새로고침
                </Button>
              </div>
              {tab === 'survey' ? (
                <ShootSurvey shoot={shoot} />
              ) : tab === 'photos' && role === 'admin' ? (
                <InternalPhotos
                  shoot={shoot}
                  busy={busy}
                  refresh={refresh}
                  onUploadingChange={setUploading}
                />
              ) : tab === 'requests' ? (
                <ShootRequests shoot={shoot} busy={locked} perform={perform} />
              ) : (
                <ShootTimeline shoot={shoot} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
