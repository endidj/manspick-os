// 고객 보드의 실제 운영 집계와 저장 가능한 검색 조건을 원본 순서로 보여줍니다.
import { useEffect, useState } from 'react';
import type { StaffRole } from '@manspick/domain';
import type { ShootBoardDTO } from '@manspick/contracts';
import { Button, Loading, Notice } from '@manspick/design-system/components';
import { TextField } from '@manspick/design-system/patterns';
import { api } from '@manspick/web/client';
import { PageHeading } from '../workspace/page-heading';
import type { View } from '../workspace/model';
import { KanbanBoard } from './kanban-board';
import { ShootTable } from './shoot-table';
import { ManualRegistration } from './manual-registration';
import { defaultBoardFilters, restoreBoardFilters, type BoardFilters } from './board-filters';
import styles from './customer-board.module.css';

type Props = {
  view: View;
  role: StaffRole;
  actorId?: string;
  onViewChange: (view: View) => void;
};

export function CustomerBoard({ view, role, actorId = 'staff', onViewChange }: Props) {
  const key = `manspick:board-filters:${actorId}`;
  const [filters, setFilters] = useState<BoardFilters>(() => {
    if (typeof window === 'undefined') return { ...defaultBoardFilters };
    try {
      return restoreBoardFilters(localStorage.getItem(key));
    } catch {
      /* 저장소를 사용할 수 없으면 기본 조건으로 표시합니다. */
    }
    return { ...defaultBoardFilters };
  });
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    requestKey: string;
    board?: ShootBoardDTO;
    error?: string;
  }>();
  const [lastBoard, setLastBoard] = useState<ShootBoardDTO>();
  const query = new URLSearchParams({
    search: filters.search,
    packageId: filters.packageId,
    addonId: filters.addonId,
    director: filters.director,
    retoucher: filters.retoucher,
    scope: filters.scope,
    pending: String(filters.pending),
    requests: String(filters.requests || view === 'requests'),
    page: String(page),
  }).toString();
  const requestKey = `${query}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    const delay = setTimeout(() => {
      api<ShootBoardDTO>(`/shoots/board?${query}`, { signal: controller.signal })
        .then((board) => {
          if (!controller.signal.aborted) {
            setResult({ requestKey, board });
            setLastBoard(board);
          }
        })
        .catch((cause: unknown) => {
          if (!controller.signal.aborted)
            setResult({ requestKey, error: (cause as Error).message });
        });
    }, 150);
    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [query, requestKey]);

  const current = result?.requestKey === requestKey ? result : undefined;
  const board = current?.board;
  const counts = lastBoard?.counts;
  const facets = lastBoard?.facets;
  const totalPages = board ? Math.max(1, Math.ceil(board.totalMatches / board.pageSize)) : 1;
  const set = <K extends keyof BoardFilters>(field: K, value: BoardFilters[K]) => {
    setPage(1);
    setFilters((current) => ({ ...current, [field]: value }));
  };
  const metrics = [
    {
      label: '오늘 촬영',
      count: counts?.today,
      hint: '오늘 예정된 촬영',
      tone: 'cyan',
      onClick: () => set('scope', 'today'),
    },
    {
      label: '미발송 템플릿',
      count: counts?.pendingTemplates,
      hint: '발송 완료 체크 필요',
      tone: 'amber',
      onClick: () => set('pending', !filters.pending),
    },
    {
      label: '입금 확인 요청',
      count: counts?.depositRequests,
      hint: '입금 확인 요청을 확인해주세요',
      tone: 'purple',
      onClick: () => set('scope', 'deposit'),
    },
    {
      label: '보정 마감 D-1',
      count: counts?.retouchDueTomorrow,
      hint: '보정 작업의 마감 일정',
      tone: 'red',
      onClick: () => onViewChange('retouch'),
    },
  ];

  function saveFilters() {
    try {
      localStorage.setItem(key, JSON.stringify(filters));
      setFeedback('이 브라우저에 필터를 저장했습니다.');
    } catch {
      setFeedback('필터를 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.');
    }
  }

  return (
    <div className={styles.screen}>
      <PageHeading
        eyebrow="ADMIN · 2-1"
        title={view === 'requests' ? '고객 요청함' : view === 'list' ? '고객 목록' : '고객 보드'}
        description={
          counts
            ? `전체 촬영 ${counts.total}건 · 오늘 촬영 ${counts.today}건 · 미발송 템플릿 ${counts.pendingTemplates}건`
            : '촬영과 고객 요청을 확인합니다.'
        }
        actions={
          <>
            <Button variant="secondary" onClick={saveFilters}>
              필터 저장
            </Button>
            <ManualRegistration
              onCreated={async () => {
                setPage(1);
                setRevision((value) => value + 1);
              }}
            />
          </>
        }
      />
      {feedback && <Notice>{feedback}</Notice>}
      <div className={styles.metrics} aria-label="운영 현황">
        {metrics.map((metric) => (
          <button
            type="button"
            key={metric.label}
            className={styles.metric}
            data-tone={metric.tone}
            onClick={metric.onClick}
          >
            <span>
              <i />
              {metric.label}
            </span>
            <strong>{metric.count ?? '–'}</strong>
            <span className={styles.metricHint}>{metric.hint}</span>
          </button>
        ))}
      </div>
      <div className={styles.toolbar}>
        <TextField
          className={styles.search}
          label="고객 검색"
          type="search"
          placeholder="이름 · 전화번호 뒤 4자리 검색"
          value={filters.search}
          onValueChange={(value) => set('search', value)}
        />
        {(
          [
            ['all', '전체'],
            ['today', '오늘 촬영'],
            ['week', '이번 주'],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            className={styles.pill}
            data-active={filters.scope === value}
            key={value}
            onClick={() => set('scope', value)}
          >
            {label}
          </button>
        ))}
        {(
          [
            ['director', '디렉터', facets?.directors ?? []],
            ['retoucher', '보정가', facets?.retouchers ?? []],
          ] as const
        ).map(([field, label, values]) => (
          <select
            className={styles.pill}
            key={field}
            aria-label={label}
            value={filters[field]}
            onChange={(event) => set(field, event.target.value)}
          >
            <option value="all">{label}: 전체</option>
            {values.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ))}
        <select
          className={styles.pill}
          aria-label="패키지"
          value={filters.packageId}
          onChange={(event) => set('packageId', event.target.value)}
        >
          <option value="all">패키지: 전체</option>
          {facets?.packages.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <select
          className={styles.pill}
          aria-label="부가서비스"
          value={filters.addonId}
          onChange={(event) => set('addonId', event.target.value)}
        >
          <option value="">부가서비스: 전체</option>
          {facets?.addons.map((addon) => (
            <option key={addon.id} value={addon.id}>
              {addon.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.pill}
          data-active={filters.pending}
          onClick={() => set('pending', !filters.pending)}
        >
          미발송 템플릿만
        </button>
        <button
          type="button"
          className={`${styles.pill} ${styles.requestPill}`}
          data-active={filters.requests || view === 'requests'}
          disabled={view === 'requests'}
          onClick={() => set('requests', !filters.requests)}
        >
          ● 요청 있음 {counts?.requests ?? '–'}
        </button>
        <button
          type="button"
          className={styles.pill}
          onClick={() => onViewChange(view === 'list' ? 'board' : 'list')}
        >
          {view === 'list' ? '보드 보기' : '목록 보기'}
        </button>
        {JSON.stringify(filters) !== JSON.stringify(defaultBoardFilters) && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setPage(1);
              setFilters({ ...defaultBoardFilters });
            }}
          >
            초기화
          </button>
        )}
      </div>
      {current?.error ? (
        <Notice tone="error">
          {current.error}
          <Button variant="ghost" size="sm" onClick={() => setRevision((value) => value + 1)}>
            다시 불러오기
          </Button>
        </Notice>
      ) : !board ? (
        <Loading />
      ) : (
        <>
          {view === 'board' ? (
            <KanbanBoard shoots={board.shoots} role={role} matchesByStage={board.matchesByStage} />
          ) : (
            <ShootTable shoots={board.shoots} role={role} />
          )}
          <nav className={styles.pagination} aria-label="촬영 목록 페이지">
            <Button
              size="sm"
              variant="secondary"
              disabled={board.page <= 1}
              onClick={() => setPage(board.page - 1)}
            >
              이전
            </Button>
            <span aria-live="polite">
              검색 결과 {board.totalMatches}건 · {board.page}/{totalPages} 페이지
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={board.page >= totalPages}
              onClick={() => setPage(board.page + 1)}
            >
              다음
            </Button>
          </nav>
        </>
      )}
    </div>
  );
}
