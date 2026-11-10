# 맨즈픽 OS · 1차 코드 검수

남성 스타일링·프로필 촬영의 예약, 입금 확인, 준비, 사진 선택·보정, 후기와 원본 전달을 고객과 직원이 같은 기록으로 처리하는 시스템입니다. 이 저장소는 가상 데이터와 대체 이미지로 코드와 업무 흐름을 검수하는 공개본입니다.

![랜딩·고객·직원 앱은 공통 API Worker를 통해 D1 예약 데이터와 비공개 R2 파일에 접근합니다.](docs/assets/architecture.svg)

## 어디부터 읽나요?

| 보고 싶은 것                                                       | 위치                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 예약이 중복으로 저장되는 것을 막는 법, 사진 열람 권한, 회사별 확장 | [DB와 아키텍처](docs/REVIEW.md)                                                                  |
| API가 요청을 검증하고 저장하는 순서                                | [공통 API](apps/server/README.md)                                                                |
| 테이블, 제약, 변경 이력                                            | [D1 마이그레이션](infra/migrations/)                                                             |
| 중복 예약·권한 거부·실패 시 롤백을 확인하는 코드                   | [서버 테스트](tests/backend.test.ts), [로컬 Workers 통합 검사](tests/local.integration.test.mjs) |
| 운영 계정, 스테이징 검수, 다음 회사에 재사용할 코드                | [운영 인수인계](docs/reference/10-client-admin-architecture.md)                                  |

## 가상 데이터로 실행하기

`package.json`의 Node.js 범위와 Yarn `4.18.1`을 사용합니다. 예를 들어 Node.js 24.22.2에서 실행할 수 있습니다. 저장소 루트에서 아래 명령을 순서대로 실행합니다.

```sh
corepack enable
yarn install --immutable
yarn db:init
yarn dev
```

`yarn db:init`은 비어 있는 로컬 DB를 처음 준비할 때 한 번 실행합니다. 이후 `yarn dev`로 API와 랜딩·고객·직원 앱을 함께 시작하면 `.local/state`에 저장한 작업이 유지됩니다. 앱을 개별 실행할 때는 다른 터미널에서 `yarn dev:server`로 API를 먼저 시작합니다. Empty와 Storybook은 API 없이 별도로 실행합니다. 로컬 실행에는 Cloudflare 계정이 필요 없습니다.

| 화면                                                | 개별 실행 명령                         | 검수 방법                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [랜딩 · 3000](http://localhost:3000)                | `yarn workspace @manspick/landing dev` | 상품 목록과 패키지 추천을 살펴봅니다.                                                                                                               |
| [고객 · 3001](http://localhost:3001)                | `yarn workspace @manspick/user dev`    | [`/start`](http://localhost:3001/start)에서 가상 예약을 접수하거나 홈에서 샘플을 고릅니다. 준비 `1002`, 셀렉 `1003`, 결과 `1004`가 확인 번호입니다. |
| [직원 · 3002](http://localhost:3002)                | `yarn workspace @manspick/admin dev`   | 로컬 대표 역할을 선택해 같은 고객의 접수와 입금 상태를 조회합니다.                                                                                  |
| [Empty · 3003](http://localhost:3003)               | `yarn workspace @manspick/empty dev`   | 공용 헤더만 표시하는 기본 화면을 확인합니다.                                                                                                        |
| [API 상태 · 8787](http://127.0.0.1:8787/api/health) | `yarn dev:server`                      | 공통 API가 실행 중인지 확인합니다.                                                                                                                  |
| [Storybook · 6006](http://127.0.0.1:6006)           | `yarn storybook`                       | 디자인 시스템의 공용 UI를 확인합니다.                                                                                                               |

## Cloudflare 배포

공개본에는 가상 데이터와 운영 설정 예시를 포함합니다. 실결제 연동, 자동 알림톡, 기존 고객 이관과 운영 복구는 별도 인수 범위입니다.

**Empty**는 [공개 테스트 주소](https://manspick-empty-test.winningant8.workers.dev)에서 확인할 수 있습니다. 권한이 있는 Cloudflare 계정으로 `yarn wrangler login`을 실행한 후 정적 사이트를 빌드하고 배포합니다.

```sh
yarn workspace @manspick/empty build
yarn wrangler deploy --config apps/empty/wrangler.jsonc
```

**API**는 [설정 예시](infra/wrangler.production.example.jsonc)를 `infra/wrangler.production.jsonc`로 복사하고 Worker 이름, D1 이름·ID, 비공개 R2 버킷, 직원·고객 앱 주소, 이메일 설정을 채웁니다. `yarn wrangler login`으로 로그인한 후 `운영 D1 이름`을 설정의 실제 DB 이름으로 바꿔 실행합니다.

```sh
yarn wrangler d1 migrations apply "운영 D1 이름" --config infra/wrangler.production.jsonc --remote
yarn wrangler deploy --config infra/wrangler.production.jsonc
```

**랜딩·고객·직원 앱**은 각 앱의 `cloudflare.config.ts`에서 운영 Worker 이름과 도메인을 지정하고 `MANSPICK_API`를 위에서 배포한 API Worker에 연결합니다. `yarn workspace @manspick/admin cf auth login`으로 로그인한 후 아래 명령을 실행합니다.

| 화면 | 배포 전 설정                                                      | 배포 명령                                 |
| ---- | ----------------------------------------------------------------- | ----------------------------------------- |
| 랜딩 | `NEXT_PUBLIC_CUSTOMER_APP_ORIGIN`, `NEXT_PUBLIC_ADMIN_APP_ORIGIN` | `yarn workspace @manspick/landing deploy` |
| 고객 | `NEXT_PUBLIC_LANDING_APP_ORIGIN`                                  | `yarn workspace @manspick/user deploy`    |
| 직원 | API의 `STAFF_APP_ORIGIN`에 직원 앱 주소 지정                      | `yarn workspace @manspick/admin deploy`   |

배포한 각 화면의 `/api/health`에서 API 연결을 확인합니다. 직원 계정과 메일 설정은 [운영 인수인계](docs/reference/10-client-admin-architecture.md)를 참고합니다.

## 수정할 위치와 검사

`apps/landing`, `apps/user`, `apps/admin`에 세 Next.js 화면이 있고 `apps/server`의 Hono API가 D1·R2를 소유합니다. 공용 UI는 `packages/design-system`, 순수 업무 규칙은 `packages/domain`, 요청과 응답 타입은 `packages/contracts`, 화면의 HTTP 호출과 표시 형식은 `packages/web`에서 관리합니다. 프런트엔드는 Vinext·Vite로 Workers용 산출물을 빌드합니다.

```sh
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn build
```

빈 검수 환경에서 앱을 실행한 뒤 `yarn test:local`로 앱 간 API 연결, 권한 거부, D1 저장과 R2 파일 전송을 확인할 수 있습니다. 통합 검사는 샘플 촬영에 가상 파일을 추가합니다. 공용 UI는 `yarn storybook`으로 별도 실행합니다. [Storybook 가이드](docs/reference/STORYBOOK.md)
