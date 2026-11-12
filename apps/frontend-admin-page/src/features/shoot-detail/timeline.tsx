// 누가 언제 어떤 이유로 촬영 진행을 바꿨는지 시간순 기록을 보여줍니다.
import { statusInfo } from '@manspick/domain';
import { Badge, EmptyState, Panel } from '@manspick/design-system/components';
import { SectionHeader } from '@manspick/design-system/patterns';
import type { ShootDetail } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import styles from './shoot-detail.module.css';

export function ShootTimeline({ shoot }: { shoot: ShootDetail }) {
  return (
    <Panel className={styles.stack}>
      <SectionHeader heading="h3" eyebrow="HISTORY" title="변경 기록" />
      {!shoot.timeline.length ? (
        <EmptyState title="아직 변경 기록이 없습니다" />
      ) : (
        <ol className={styles.timeline}>
          {shoot.timeline.map((entry) => (
            <li key={entry.id}>
              <span className={styles.timelineMarker} aria-hidden="true" />
              <div>
                <strong>{entry.reason}</strong>
                <p>
                  {entry.actorName} · {dateTime(entry.createdAt)}
                </p>
                {entry.to && <Badge>{statusInfo(entry.to).label}</Badge>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
