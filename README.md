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

`yarn db:init`은 비어 있는 로컬 DB를 처음 준비할 때 한 번 실행합니다. 이후 `yarn dev`로 재개하면 `.local/state`에 저장한 작업이 유지됩니다. 로컬 흐름에는 Cloudflare 계정이 필요 없습니다.

| 화면                                         | 검수 방법                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [랜딩](http://localhost:3000)                | 상품 목록과 패키지 추천을 살펴봅니다.                                                                       |
| [고객 예약](http://localhost:3001/start)     | 가상 고객으로 예약을 접수합니다.                                                                            |
| [직원 앱](http://localhost:3002)             | 로컬 대표 역할을 선택해 같은 고객의 접수와 입금 상태를 조회합니다.                                          |
| [고객 개인 페이지](http://localhost:3001)    | 샘플을 골라 준비·셀렉·보정 결과를 각각 살펴봅니다. 준비 `1002`, 셀렉 `1003`, 결과 `1004`가 확인 번호입니다. |
| [API 상태](http://127.0.0.1:8787/api/health) | 공통 API가 실행 중인지 확인합니다.                                                                          |

운영 환경은 별도 설정과 검수를 거칩니다. 실결제 연동, 자동 알림톡, 기존 고객 이관과 운영 복구는 별도 인수 범위입니다. 공개본에는 고객 자료와 운영 리소스 설정 대신 가상 데이터와 [설정 예시](infra/wrangler.production.example.jsonc)가 들어 있습니다.

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
