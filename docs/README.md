# 맨즈픽 OS 문서

[프로젝트 README](../README.md)에서 저장소 구조와 로컬 실행 방법을 확인할 수 있습니다.

Codex는 루트 `AGENTS.md`의 안내에 따라 프로젝트 작업 규칙을 읽습니다. 사람과 AI는 작업에 필요한 설계·운영·검증 문서를 골라 참고합니다. 현재 동작을 확인할 때는 코드, 설정, 테스트를 먼저 확인합니다.

## 작업 기준

- [프로젝트 작업 규칙](AGENTS.md) · 공용 패키지 재사용, 코드 경계, 구현과 검증
- [제품 요구사항](01-product-requirements.md) · 목표 동작, 업무 상태, 수용 기준
- [시각 기준](DESIGN.md) · 앱별 디자인 방향, 색상, 서체와 상태 표현
- [Cloudflare 아키텍처](07-cloudflare-architecture.md) · 프런트엔드, NestJS API Worker, D1·R2 경계

Next.js 앱별 개발 규칙은 [랜딩](../apps/frontend-landing-page/AGENTS.md), [고객](../apps/frontend-customer-page/AGENTS.md), [직원](../apps/frontend-admin-page/AGENTS.md) 앱에서 확인합니다.

## 상세 참고

- [계정·권한·개인정보](reference/02-accounts-and-permissions.md) · 업무 권한과 개인정보 정책. Supabase 관련 절은 초기 기술 설계입니다.
- [디자인 시스템](reference/03-design-system.md) · Figma 토큰, 공용 컴포넌트와 자산 명세
- [Storybook](reference/STORYBOOK.md) · 로컬 실행, 상호작용과 접근성 검사
- [출처와 열람 범위](reference/00-sources-and-traceability.md) · Figma·Notion 자료와 원본 링크
- [Figma 화면 대응](reference/13-figma-parity.md) · 고객·직원 화면 매핑과 당시 비교 결과
- [운영 인수인계](reference/10-client-admin-architecture.md#현재-맨즈픽-운영-인수인계) · 운영 설정, 복구 절차와 고객사별 재사용 설계
- [클라이언트 미팅](reference/19-client-review.md) · 시연 순서, 300만원 검수 제안, 운영 출시 조건
- [DB와 아키텍처](reference/20-database-review.md) · 현재 스키마, 예약 경합, 파일 권한과 회사별 확장
- [NestJS 마이그레이션](reference/21-nestjs-migration.md) · HTTP 계층 전환, Workers 런타임 제약, 회귀 검사와 배포 기록
- [랜딩 사이트 마이그레이션](reference/23-landing-site-migration.md) · 운영 원본 화면·애니메이션 대조, 상담 상품, 전체 앱 검색 제외
- [사진·폰트 최적화](reference/24-media-optimization.md) · 메타데이터 없는 반응형 이미지, 증분 생성, 폰트 로딩과 검증
- [랜딩 정적 생성과 코드 분할](reference/25-landing-static-rendering.md) · SSG/SSR 경계, 지연 기능, Lighthouse SEO 69의 원인
- [랜딩 추가 성능·캐시](reference/26-landing-performance.md) · 파비콘·폰트·CSS·렌더 최적화, 배포별 캐시 갱신
- [랜딩·고객 공개 테스트 배포](reference/22-public-test-deployment.md) · 기존 공개 테스트 환경과 배포 기록
- [역할별 QA](reference/18-role-workflow-qa.md) · 고객과 직원의 수동 검증 시나리오

## 보관 기록

초기 설계의 근거와 당시 확인한 결과를 `archive/`에 보관합니다.

- [초기 데이터와 업무 흐름](archive/05-data-and-flows.md) · 논리 모델, ERD, 업무 제약
- [초기 결정과 출시 계획](archive/06-decisions-and-delivery.md) · 원래의 설계 판단, 미결 정책과 출시 조건
- [초기 공수 추정](archive/08-scope-estimate.md) · 작업량과 일정 가정
- [1차 구현과 검증 기록](archive/09-implementation-status.md) · 당시 구현 표, 검사 결과와 이후 변경 기록
- [사진·폰트 최적화 계획](archive/24-media-optimization-plan.md) · 원본 보존과 화면 회귀 검사 범위
- [랜딩 정적 생성 계획](archive/25-landing-static-plan.md) · 렌더링 전환과 선택 기능 분할 범위
- [랜딩 추가 성능 계획](archive/26-landing-performance-plan.md) · 감사 근거와 회귀 검사 범위
