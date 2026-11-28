// 촬영을 여섯 단계로 나누고 고객별 내 정보 제출 여부를 표시합니다.
import { BOARD_STAGE_LABELS } from '@manspick/domain';
import { KanbanCard, StageBadge } from '@manspick/design-system/components';
import type { ShootBoardDTO } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import styles from './customer-board.module.css';

const boardStages = [
  { stage: 1, tone: 'neutral' },
  { stage: 2, tone: 'blue' },
  { stage: 3, tone: 'amber' },
  { stage: 4, tone: 'purple' },
  { stage: 5, tone: 'pink' },
  { stage: 6, tone: 'green' },
] as const;

export function KanbanBoard({
  shoots,
  matchesByStage,
}: Pick<ShootBoardDTO, 'shoots' | 'matchesByStage'>) {
  return (
    <div className={styles.kanban} role="region" aria-label="6단계 촬영 보드" tabIndex={0}>
      {boardStages.map(({ stage, tone }) => {
        const label = BOARD_STAGE_LABELS[stage - 1];
        const items = shoots.filter((shoot) => shoot.boardStage === stage);
        const count = matchesByStage[stage - 1] ?? items.length;
        return (
          <section
            className={styles.column}
            key={label}
            aria-label={`${label} 검색 결과 ${count}건`}
          >
            <header className={styles.columnHeader}>
              <StageBadge
                stage={stage}
                tone={tone}
                label={label.replace(' (', '\n(')}
                className={styles.stage}
              />
              <span>{count}</span>
            </header>
            <div className={styles.cards}>
              {items.map((shoot) => (
                <KanbanCard
                  key={shoot.id}
                  href={`/shoots/${encodeURIComponent(shoot.id)}`}
                  title={shoot.customerName}
                  packageLabel={shoot.packageName}
                  status={
                    stage <= 3 && (
                      <>
                        내정보 입력{' '}
                        <span
                          className={shoot.profileSubmitted ? styles.complete : styles.incomplete}
                        >
                          {shoot.profileSubmitted ? '완료' : '미완료'}
                        </span>
                      </>
                    )
                  }
                  dateLabel={dateTime(shoot.startsAt, 'compact')}
                  assignee={shoot.directorName ?? '배정 대기'}
                  className={`${styles.card} ${shoot.pendingRequests > 0 ? styles.attention : ''}`}
                />
              ))}
              {!items.length && (
                <p className={styles.emptyColumn}>
                  {count ? '이 페이지에 촬영이 없어요' : '조건에 맞는 촬영이 없어요'}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
