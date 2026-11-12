// 촬영을 최신 업무 순서의 일곱 단계로 나누고 확인할 요청을 카드에 표시합니다.
import { STAGE_LABELS, type StaffRole } from '@manspick/domain';
import { KanbanCard, StageBadge, type StageBadgeTone } from '@manspick/design-system/components';
import type { ShootSummary } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import styles from './customer-board.module.css';

const tones: StageBadgeTone[] = ['neutral', 'purple', 'blue', 'cyan', 'amber', 'green', 'pink'];
const nextActions = [
  '옵션 정보 확인',
  '예약·입금 확인',
  '고객 설문 확인',
  '촬영 준비 확인',
  '현장 진행 확인',
  '셀렉·보정 확인',
  '후기·원본 확인',
];

export function KanbanBoard({
  shoots,
  role,
  matchesByStage,
}: {
  shoots: ShootSummary[];
  role: StaffRole;
  matchesByStage: number[];
}) {
  return (
    <div className={styles.kanban} role="region" aria-label="7단계 촬영 보드" tabIndex={0}>
      {STAGE_LABELS.map((label, index) => {
        const items = shoots.filter((shoot) => shoot.stage === index + 1);
        const count = matchesByStage[index] ?? items.length;
        return (
          <section
            className={styles.column}
            key={label}
            aria-label={`${label} 검색 결과 ${count}건`}
          >
            <header className={styles.columnHeader}>
              <StageBadge
                stage={(index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                label={label}
                tone={tones[index]}
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
                  status={shoot.statusLabel}
                  dateLabel={dateTime(shoot.startsAt, 'compact')}
                  assignee={
                    role === 'retoucher'
                      ? (shoot.retoucherName ?? '배정 작업')
                      : (shoot.directorName ?? '배정 대기')
                  }
                  nextAction={
                    shoot.nextAction ||
                    (shoot.pendingRequests > 0
                      ? `요청 ${shoot.pendingRequests}건 확인`
                      : nextActions[index])
                  }
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
