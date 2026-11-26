// 사진별 수정 의견을 보여주고 허용된 직원만 요청을 처리하거나 반려합니다.
import { Badge, Button, EmptyState, Panel } from '@manspick/design-system/components';
import { SectionHeader } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import type { PerformAction } from './use-shoot-detail';
import styles from './shoot-detail.module.css';

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
  const requests = shoot.requests.filter(
    (request) =>
      request.type === 'deposit' && (!compact || ['new', 'processing'].includes(request.state)),
  );
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
              title={'입금 확인 요청'}
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
