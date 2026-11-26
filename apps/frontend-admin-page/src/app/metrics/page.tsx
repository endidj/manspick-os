// 관리자 권한으로 열 수 있는 독립 지표 페이지입니다.
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MetricsDTO } from '@manspick/contracts';
import { api } from '@manspick/web/client';
import { Loading, Panel } from '@manspick/design-system/components';
import styles from './metrics.module.css';

const orderStages = [
  ['order_options', '상품 선택'],
  ['order_details', '기본 정보'],
  ['order_schedule', '희망 일정'],
  ['order_completed', '주문 완료'],
];
const sectionNames: Record<string, string> = {
  hero: '첫 화면',
  why: '촬영 소개',
  'before-after': '촬영 전후',
  reviews: '후기',
  how: '촬영 방식',
  team: '팀 소개',
  process: '이용 절차',
  pricing: '상품 가격',
  faq: '자주 묻는 질문',
  cta: '상담 신청',
};
function percent(value: number, base: number) {
  return base ? `${((100 * value) / base).toFixed(1)}%` : '—';
}
function Funnel({ stages }: { stages: [string, number][] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>단계</th>
          <th>도달</th>
          <th>이전 단계 이탈</th>
          <th>이탈률</th>
        </tr>
      </thead>
      <tbody>
        {stages.map(([name, value], i) => {
          const previous = stages[i - 1]?.[1];
          return (
            <tr key={name}>
              <th scope="row">{name}</th>
              <td>{value}</td>
              <td>{previous != null ? Math.max(0, previous - value) : '—'}</td>
              <td>{previous != null ? percent(Math.max(0, previous - value), previous) : '—'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsDTO>(),
    [error, setError] = useState('');
  useEffect(() => {
    const stop = new AbortController();
    api<MetricsDTO>('/analytics/metrics', { signal: stop.signal })
      .then(setData)
      .catch((failure: Error) => {
        if (!stop.signal.aborted) setError(failure.message);
      });
    return () => stop.abort();
  }, []);
  return (
    <main id="main" className={styles.metrics}>
      <Link href="/">운영 홈</Link>
      <h1>운영 지표</h1>
      {error ? (
        <p role="alert">{error} 운영 홈에서 관리자 계정으로 로그인해주세요.</p>
      ) : !data ? (
        <Loading />
      ) : (
        <>
          <Panel>
            <h2>랜딩페이지</h2>
            <p>
              누적 방문 탭 기준 · 모바일{' '}
              {data.visits.find((v) => v.device === 'mobile')?.visits ?? 0} · 데스크톱{' '}
              {data.visits.find((v) => v.device === 'desktop')?.visits ?? 0}
            </p>
            <table>
              <thead>
                <tr>
                  <th>섹션</th>
                  <th>기기</th>
                  <th>방문</th>
                  <th>이탈</th>
                  <th>이탈률</th>
                  <th>평균 체류</th>
                  <th>클릭</th>
                </tr>
              </thead>
              <tbody>
                {data.sections.map((s) => (
                  <tr key={s.section + s.device}>
                    <th scope="row">
                      {sectionNames[s.section] ?? s.section.replace('section-', '섹션 ')}
                    </th>
                    <td>{s.device === 'mobile' ? '모바일' : '데스크톱'}</td>
                    <td>{s.views}</td>
                    <td>{s.exits}</td>
                    <td>{percent(s.exits, s.views)}</td>
                    <td>{s.views ? Math.round(s.durationMs / s.views / 1000) : 0}초</td>
                    <td>{s.clicks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.sections.length === 0 && <p>아직 기록된 섹션 방문이 없습니다.</p>}
          </Panel>
          <Panel>
            <h2>자사 주문</h2>
            <p>외부 플랫폼 기결제 접수를 제외한 누적 방문 탭입니다.</p>
            <Funnel
              stages={orderStages.map(([id, name]) => [
                name,
                data.orders.find((o) => o.stage === id)?.visits ?? 0,
              ])}
            />
            <p>전체 입금 확정 {data.confirmedPayments}건</p>
          </Panel>
          <Panel>
            <h2>주문 이후 전환</h2>
            <p>
              누적 주문 기준 · 신규 가입 {data.postOrder.signup}건 · 기존 회원 로그인{' '}
              {data.postOrder.login}건
            </p>
            <Funnel
              stages={[
                ['주문 완료', data.postOrder.completed],
                ['가입 또는 로그인', data.postOrder.authenticated],
                ['설문 시작', data.postOrder.surveyStarted],
                ['설문 제출', data.postOrder.surveySubmitted],
              ]}
            />
          </Panel>
        </>
      )}
    </main>
  );
}
