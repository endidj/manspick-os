# @manspick/server

랜딩·고객·어드민 앱이 공유하는 NestJS API Worker입니다. 각 앱의 `/api` 프록시가 `MANSPICK_API` 서비스 바인딩으로 요청을 보내면 서버가 인증·권한을 확인하고 D1의 예약 데이터와 비공개 R2 파일을 처리합니다. [제품 요구사항](../../docs/product-requirements.md) · [예약 DB 관계도](../../docs/database.md)

## 환경과 검사

저장소 루트에서 실행합니다. 빈 로컬 DB는 최초 한 번만 `yarn db:init`으로 스키마와 가상 데이터를 준비합니다. **기존 DB에는** 아래 명령으로 미적용 스키마만 반영합니다. 로컬 D1·R2의 저장 위치는 `.local/state`입니다.

```sh
yarn wrangler d1 migrations apply manspick-local --local --config infra/wrangler.jsonc --persist-to .local/state
yarn dev:server
```

서버 상태는 [로컬 API 상태 확인](http://127.0.0.1:8787/api/health)에서 봅니다. 아래 검사는 저장소 루트에서 실행합니다.

| 명령                                        | 확인하는 항목                                                 |
| ------------------------------------------- | ------------------------------------------------------------- |
| `yarn workspace @manspick/server typecheck` | 서버 TypeScript 타입                                          |
| `yarn test`                                 | Nest·Express 컨트롤러, 가드, 업무 규칙, 데이터 접근 회귀 검사 |
| `yarn workspace @manspick/server build`     | Wrangler dry-run으로 Worker 번들 생성                         |
| `yarn test:local`                           | `yarn dev` 실행 중인 로컬 Worker·화면 앱·D1·R2 통합 경로      |

운영 API에는 `DB`(D1)와 `BUCKET`(비공개 R2)을 바인딩합니다. 직원 이메일 로그인에는 승인된 발신 주소 `STAFF_EMAIL_FROM`, 허용할 회사 도메인 `STAFF_EMAIL_DOMAIN`, 어드민 HTTPS 주소 `STAFF_APP_ORIGIN`, 메일 바인딩 `EMAIL`이 필요합니다. 고객 링크의 기준 주소는 `CUSTOMER_APP_ORIGIN`입니다. 카카오·Google 로그인을 켜려면 공급자별 `KAKAO_CLIENT_ID`·`KAKAO_CLIENT_SECRET` 또는 `GOOGLE_CLIENT_ID`·`GOOGLE_CLIENT_SECRET`을 설정하고 고객 앱의 `/social/kakao`·`/social/google` 콜백을 등록합니다. [운영 설정 예시](../../infra/wrangler.production.example.jsonc) · [환경 바인딩](src/runtime/env.ts)

운영 전에는 회사 계정으로 로그인 메일 수신과 비활성화 후 기존 세션 차단을 확인합니다. D1 복구는 R2의 사진을 복구하지 않으므로 두 저장소를 함께 복원할 수 있어야 합니다. 장애 로그에는 요청 ID와 오류 코드만으로 추적할 수 있게 하고 전화번호·인증 토큰·고객 링크는 남기지 않습니다.

## 런타임과 배포 범위

- Worker가 isolate에서 Nest 앱을 한 번 부팅하고 `cloudflare:node`의 `handleAsNodeRequest()`로 Express에 요청을 전달합니다. 원본 Fetch 요청과 바인딩은 `AsyncLocalStorage`로 요청마다 분리합니다. Origin과 접근 권한을 먼저 확인한 뒤 본문을 한 번만 읽습니다. [Worker 진입점](src/runtime/worker-handler.ts) · [HTTP 설정](src/http/app.ts)
- Wrangler 빌드는 생성자 타입의 decorator metadata를 생성하지 않습니다. 의존성은 명시적 `@Inject()` 또는 factory provider로 주입합니다. 기능 모듈과 전역 가드·예외 필터는 앱 모듈에서 조립합니다. [앱 모듈](src/app.module.ts)
- 서버는 Workers의 Node HTTP 호환 계층에서 실행합니다. 번들 검사 후 실제 환경에서 상태 확인, 로그인, 보호된 파일 다운로드를 점검합니다. [로컬 Wrangler 설정](../../infra/wrangler.jsonc) · [Node HTTP 어댑터 테스트](../../tests/nest-http.test.ts)

## 인증과 업무 변경

- 고객은 자기 세션의 촬영, 디렉터는 본인에게 배정된 촬영, 보정가는 본인의 보정 작업이 있는 촬영만 조회합니다. 대표(`admin`)와 운영직원(`staff`)은 전체 촬영을 조회합니다. 고객 전화번호와 결제 정보는 보정가에게 숨깁니다. 직원 계정·설정 변경 권한은 `admin` 역할에서 검사합니다. [세션 및 가드](src/http/access.ts) · [촬영 조회 범위](src/shoots/access.ts) · [응답 필터](src/shoots/queries.ts)
- 운영자가 고객 상세에서 개인 링크를 재발급하면 이전 링크와 해당 촬영의 고객 세션이 무효화됩니다. 직원 계정을 비활성화하거나 역할을 바꾸면 세션과 미사용 로그인 링크를 폐기하고 감사 이력을 남깁니다. [고객 링크](src/security/customer-link.ts) · [직원 계정](src/security/staff-accounts.ts)
- 업무 명령은 역할·입력·현재 상태를 확인해 SQL을 준비합니다. 서버는 촬영 버전과 명령별 조건을 재확인하고 업무 변경·버전 증가·진행 이력을 같은 D1 batch에 저장합니다. [업무 명령](src/shoots/actions.ts) · [원자적 저장](src/database/mutations.ts)
- 서버가 파일의 촬영 소유권과 종류별 공개 범위를 검사한 뒤 비공개 R2 객체를 스트리밍합니다. 내부 사진은 권한 있는 직원만 열람합니다. 업로드는 실제 이미지 형식과 크기를 검사하며 D1 기록 저장에 실패하면 해당 요청이 올린 R2 객체를 정리합니다. [파일 접근](src/files/access.ts) · [업로드와 재시도](src/files/uploads.ts)

## 통합 테스트 환경

랜딩·고객·어드민 테스트 앱은 비공개 `manspick-public-api-test`와 같은 D1·R2를 사용합니다. 고객 앱에서 만든 예약을 어드민에서 확인할 수 있습니다. 프록시가 앱 종류를 지정하고 API는 관리자 역할 선택을 어드민 앱에, 신규 예약 개인 링크 반환을 고객 앱에 한정합니다. 역할 선택으로 로그인할 수 있으므로 이 환경에는 가상 데이터만 사용합니다. 시드의 [가상 고객 예약](https://manspick-customer-test.winningant8.workers.dev/s/demo-payment-access)은 전화번호 뒤 네 자리 `1001`로 확인합니다. [테스트 환경 설정](../../infra/wrangler.public-test.jsonc) · [앱별 테스트 권한](src/runtime/public-test.ts)

공개 테스트 DB를 새로 만들 때는 스키마를 적용한 뒤 빈 DB에만 `infra/seed.sql`을 한 번 실행합니다. 가상 사진은 `yarn db:public-test:media`로 준비합니다. 운영에서는 데모 시드와 테스트용 Worker 진입점을 사용하지 않습니다. 배포 순서와 앱별 주소는 [루트 README](../../README.md)에 있습니다.
