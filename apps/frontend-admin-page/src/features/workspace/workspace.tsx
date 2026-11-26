// 로그인한 역할과 주소에 맞는 원본 운영 화면을 연결합니다.
'use client';

import { useState } from 'react';
import { Button, Loading, Notice, Panel } from '@manspick/design-system/components';
import { StaffLogin, useStaffLoginToken } from '../authentication';
import { CustomerBoard } from '../board';
import { MyCustomers, MobileHeader } from '../director';
import { Followups, Notifications, Packages, Settings, Templates } from '../operations';
import { Schedule } from '../schedule';
import { AdminShell } from '../shell';
import { ShootDetailScreen } from '../shoot-detail';
import { PageHeading } from './page-heading';
import { StaffInbox } from '../operations/staff-inbox';
import { useShootList } from './use-shoot-list';
import { useWorkspace } from './use-workspace';
import { needsShootList, resolveView } from './model';
import styles from './workspace.module.css';

export function AdminApp({ initialShootId }: { initialShootId?: string }) {
  const workspace = useWorkspace();
  const staffLoginToken = useStaffLoginToken();
  const { session, checked, view, error, busy, navigate } = workspace;
  const [selected, setSelected] = useState('');
  const shootListKey = !initialShootId && needsShootList(view) ? session?.actor.id : undefined;
  const { shoots, error: listError, retry } = useShootList(shootListKey);
  if (!checked || !session || staffLoginToken)
    return (
      <StaffLogin
        busy={!checked || busy}
        error={error}
        onLogin={workspace.login}
        token={staffLoginToken}
      />
    );
  const role = session.actor.role;
  if (role === 'customer') return null;
  const current = shoots?.find((shoot) => shoot.id === selected) ?? shoots?.[0];
  const available = resolveView(view, role) === view;
  return (
    <AdminShell
      actor={session.actor}
      view={view}
      detail={Boolean(initialShootId) || view === 'detail'}
      busy={busy}
      onNavigate={navigate}
      onLogout={workspace.logout}
    >
      {initialShootId ? (
        <ShootDetailScreen key={initialShootId} shootId={initialShootId} role={role} />
      ) : (
        <div className={styles.workspace}>
          {(error || listError) && (
            <div className={styles.feedback}>
              <Notice tone="error">{listError || error}</Notice>
              {listError && (
                <Button size="sm" variant="secondary" onClick={retry}>
                  다시 불러오기
                </Button>
              )}
            </div>
          )}
          {!available ? (
            <Notice tone="error">이 역할에서 사용할 수 없는 메뉴입니다.</Notice>
          ) : shootListKey && !shoots ? (
            !listError && <Loading />
          ) : view === 'my-customers' || view === 'today' ? (
            <MyCustomers
              key={view}
              shoots={shoots ?? []}
              name={session.actor.name}
              todayOnly={view === 'today'}
            />
          ) : view === 'calendar' ? (
            <Schedule role={role} />
          ) : view === 'templates' ? (
            <Templates key={session.actor.id} role={role} />
          ) : view === 'packages' ? (
            <Packages role={role} />
          ) : view === 'followups' ? (
            <Followups role={role} />
          ) : view === 'settings' ? (
            <Settings actorId={session.actor.id} />
          ) : view === 'notifications' ? (
            <>
              <PageHeading
                eyebrow="ADMIN · MESSAGES"
                title="발송 대기"
                description="서버에 기록된 안내와 수동 발송 상태를 확인합니다."
              />
              <Notifications />
              <StaffInbox />
            </>
          ) : view === 'detail' ? (
            <>
              <label className={styles.customerSelect}>
                고객 선택
                <select
                  value={current?.id ?? ''}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  {shoots?.map((shoot) => (
                    <option key={shoot.id} value={shoot.id}>
                      {shoot.customerName} · {shoot.packageName}
                    </option>
                  ))}
                </select>
              </label>
              {current ? (
                <ShootDetailScreen key={current.id} shootId={current.id} role={role} />
              ) : (
                <Notice>등록된 고객이 없습니다.</Notice>
              )}
            </>
          ) : view === 'profile' ? (
            <>
              <MobileHeader title="내 정보" subtitle={role === 'director' ? '디렉터' : '보정가'} />
              <Panel>
                <h1>{session.actor.name}</h1>
                <p>본인에게 배정된 예약의 알림을 받습니다.</p>
                <StaffInbox />
                <Button variant="secondary" loading={busy} onClick={workspace.logout}>
                  로그아웃
                </Button>
              </Panel>
            </>
          ) : (
            <CustomerBoard
              key={`${session.actor.id}:${view === 'requests'}`}
              view={view}
              role={role}
              actorId={session.actor.id}
              onViewChange={navigate}
            />
          )}
        </div>
      )}
    </AdminShell>
  );
}
