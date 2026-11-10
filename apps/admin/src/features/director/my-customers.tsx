// 디렉터에게 실제 배정된 고객을 오늘 촬영과 준비 상태별로 보여줍니다.
import Link from 'next/link';
import { useState } from 'react';
import { koreaDate, STAGE_LABELS } from '@manspick/domain';
import { EmptyState, StageBadge } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import { dateTime } from '@manspick/web/format';
import type { ShootSummary } from '@manspick/contracts';
import { shootHref } from '../workspace/model';
import { MobileHeader } from './mobile-header';
import styles from './director.module.css';

export function MyCustomers({
  shoots,
  name,
  todayOnly = false,
}: {
  shoots: ShootSummary[];
  name: string;
  todayOnly?: boolean;
}) {
  const [filter, setFilter] = useState(todayOnly ? 'today' : 'all');
  const today = koreaDate();
  const groups = [
    {
      id: 'today',
      label: '오늘 촬영',
      test: (s: ShootSummary) => Boolean(s.startsAt && koreaDate(new Date(s.startsAt)) === today),
    },
    {
      id: 'week',
      label: '이번 주',
      test: (s: ShootSummary) =>
        Boolean(
          s.startsAt &&
          new Date(s.startsAt) >= new Date(`${today}T00:00:00+09:00`) &&
          new Date(s.startsAt) <
            new Date(new Date(`${today}T00:00:00+09:00`).getTime() + 7 * 86400000),
        ),
    },
    {
      id: 'preparation',
      label: '준비 필요',
      test: (s: ShootSummary) => s.stage === 3 || s.stage === 4,
    },
    { id: 'complete', label: '촬영 완료', test: (s: ShootSummary) => s.stage >= 6 },
    {
      id: 'selection',
      label: '셀렉 대기',
      test: (s: ShootSummary) => s.status === 'selection_pending',
    },
  ];
  const visible =
    filter === 'all' ? shoots : shoots.filter(groups.find((g) => g.id === filter)!.test);
  const todo = shoots.filter(
    (s) => s.stage === 3 || s.stage === 4 || s.status === 'shoot_complete',
  );
  return (
    <div className={styles.mobile}>
      <MobileHeader
        title={`${todayOnly ? '오늘 촬영' : '내 고객'} · ${name}`}
        subtitle="DIRECTOR · 3-1"
      />
      <div className={styles.filters}>
        {groups.map((g) => (
          <button
            type="button"
            key={g.id}
            data-active={filter === g.id}
            onClick={() => setFilter(filter === g.id ? 'all' : g.id)}
          >
            {g.label}
            {g.id !== 'complete' && ` ${shoots.filter(g.test).length}`}
          </button>
        ))}
      </div>
      {todo.length > 0 && (
        <div className={styles.todo}>
          <Icon name="chat" size={18} />할 일 {todo.length}건 — 촬영 설계·장소 세팅·후보 업로드
        </div>
      )}
      <div className={styles.customerList}>
        {visible.map((shoot) => (
          <Link
            className={styles.customerCard}
            href={shootHref(shoot.id, 'manage')}
            key={shoot.id}
            data-attention={shoot.stage === 4 || undefined}
          >
            <div className={styles.cardTop}>
              <span>{dateTime(shoot.startsAt)}</span>
              <StageBadge
                stage={Math.max(1, shoot.stage) as 1 | 2 | 3 | 4 | 5 | 6 | 7}
                label={STAGE_LABELS[Math.max(0, shoot.stage - 1)]!}
              />
            </div>
            <div className={styles.customerName}>
              <strong>{shoot.customerName}</strong>
              <span>{shoot.packageName}</span>
              <Icon name="chevron" size={16} />
            </div>
            <p>
              {shoot.statusLabel}
              <span> · {shoot.nextAction}</span>
            </p>
          </Link>
        ))}
        {!visible.length && <EmptyState title="해당하는 고객이 없습니다" />}
      </div>
    </div>
  );
}
