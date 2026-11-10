// 사진별 수정 의견을 보여주고 허용된 직원만 요청을 처리하거나 반려합니다.
import { Badge, Button, EmptyState, Panel } from '@manspick/design-system/components';
import { InfoRow, SectionHeader } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

const requestLabels: Record<string, string> = {
  revision: '보정 수정 요청',
  review: '후기 확인 요청',
  deposit: '입금 확인 요청',
};
const stateLabels: Record<string, string> = {
  new: '신규',
  processing: '처리 중',
  completed: '처리 완료',
  rejected: '반려',
};

export function ShootRequests({
  shoot,
  busy,
  perform,
  compact = false,
}: {
  shoot: ShootDetail;
  busy: boolean;
  perform: PerformAction;
  compact?: boolean;
}) {
  const requests = compact
    ? shoot.requests.filter((request) => ['new', 'processing'].includes(request.state))
    : shoot.requests;
  return (
    <div className={styles.stack}>
      {!requests.length && (
        <EmptyState
          title={compact ? '처리를 기다리는 요청이 없습니다' : '접수된 요청이 없습니다'}
        />
      )}
      {requests.map((request) => (
        <Panel
          key={request.id}
          className={`${styles.stackSmall} ${['new', 'processing'].includes(request.state) ? styles.attentionPanel : ''}`}
        >
          <div className={styles.sectionHeading}>
            <SectionHeader
              heading="h3"
              title={requestLabels[request.type] ?? request.type}
              description={dateTime(request.createdAt)}
            />
            <Badge
              tone={
                request.state === 'completed'
                  ? 'green'
                  : request.state === 'rejected'
                    ? 'neutral'
                    : 'amber'
              }
            >
              {stateLabels[request.state] ?? request.state}
            </Badge>
          </div>
          {request.message && <p className={styles.preWrap}>{request.message}</p>}
          {request.items.map((item, index) => (
            <InfoRow
              key={`${item.photoId}-${index}`}
              label={`사진 ${shoot.photos.find((photo) => photo.id === item.photoId)?.cutNo ?? item.photoId}`}
              value={item.comment}
              className={styles.answer}
            />
          ))}
          {shoot.capabilities.includes('resolve_request') &&
            ['new', 'processing'].includes(request.state) && (
              <div className={styles.row}>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    perform({
                      type: 'resolve_request',
                      requestId: request.id,
                      decision: 'complete',
                    })
                  }
                >
                  확인·처리 완료
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    perform({ type: 'resolve_request', requestId: request.id, decision: 'reject' })
                  }
                >
                  반려
                </Button>
              </div>
            )}
        </Panel>
      ))}
    </div>
  );
}
