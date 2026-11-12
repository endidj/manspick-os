// 서버가 허용한 고객 또는 보정 작업을 표로 보여주고 촬영 상세로 연결합니다.
import Link from 'next/link';
import type { StaffRole } from '@manspick/domain';
import { Badge, EmptyState } from '@manspick/design-system/components';
import { Icon } from '@manspick/design-system/icons';
import type { ShootSummary } from '@manspick/contracts';
import { dateTime } from '@manspick/web/format';
import styles from './customer-board.module.css';

export function ShootTable({ shoots, role }: { shoots: ShootSummary[]; role: StaffRole }) {
  if (!shoots.length)
    return (
      <EmptyState title="해당하는 촬영이 없습니다" description="검색어나 필터를 바꿔보세요." />
    );
  return (
    <div className={styles.tableWrap} role="region" aria-label="촬영 목록" tabIndex={0}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{role === 'retoucher' ? '배정 작업' : '고객'}</th>
            <th scope="col">패키지</th>
            <th scope="col">진행 상태</th>
            <th scope="col">촬영 일정</th>
            <th scope="col">{role === 'retoucher' ? '담당 보정가' : '담당 디렉터'}</th>
            <th scope="col">요청</th>
          </tr>
        </thead>
        <tbody>
          {shoots.map((shoot) => (
            <tr key={shoot.id}>
              <td>
                <Link
                  className={styles.customerLink}
                  href={`/shoots/${encodeURIComponent(shoot.id)}`}
                >
                  {shoot.customerName}
                  <Icon name="chevron" size={12} />
                </Link>
                {role !== 'retoucher' && shoot.phoneMasked && (
                  <p className={styles.phone}>{shoot.phoneMasked}</p>
                )}
              </td>
              <td>{shoot.packageName}</td>
              <td>
                <Badge tone="blue">{shoot.statusLabel}</Badge>
              </td>
              <td>{dateTime(shoot.startsAt)}</td>
              <td>
                {role === 'retoucher'
                  ? (shoot.retoucherName ?? '배정 작업')
                  : (shoot.directorName ?? '미정')}
              </td>
              <td>{shoot.pendingRequests || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
