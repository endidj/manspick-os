# @manspick/server

고객·직원의 인증과 권한, 촬영 업무 명령, D1 데이터와 R2 파일을 소유하는 Hono 기반 Cloudflare 서버입니다. `apps`는 화면 유무와 관계없이 독립 실행하는 서비스를 뜻합니다. 현재 서버는 Wrangler로 실행되며 세 Next 앱의 요청을 받습니다.

## 실행과 공유 경계

`src/worker.ts`가 유일한 Worker 진입점이며 `{ fetch: handleRequest }`를 Cloudflare에 연결합니다. `http/app.ts`의 `handleRequest()`는 Hono 라우팅과 공통 오류 처리를 수행합니다. 테스트에서는 이 함수를 직접 호출합니다. 별도 재수출용 `index.ts`와 `infra/worker.ts`는 두지 않습니다.

화면 앱은 이 실행부를 import하지 않습니다. 요청·응답 타입은 `@manspick/contracts`에서 `import type`으로 공유하며, 순수 업무 규칙은 `@manspick/domain`을 재사용합니다. 외부 런타임 의존성은 기존 `hono@4.13.16`입니다. 브라우저 요청과 Next 프록시는 `@manspick/web`이 맡습니다.

```sh
yarn dev:server
yarn workspace @manspick/server typecheck
yarn workspace @manspick/server build
```

루트 `infra/wrangler.jsonc`가 이 서버를 직접 실행합니다. 서버의 build는 원격 배포 없이 `.local/build/server`에 Worker를 묶는 dry-run입니다. 로컬 상태는 기존 루트 `.local/state`를 그대로 사용하며 DB·bucket 식별자를 바꾸지 않습니다.

## Next와 나눈 이유

공통 업무 코드를 공유하는 데 별도 서버가 반드시 필요한 것은 아닙니다. 각 Next Route Handler가 공유 함수를 직접 실행하는 구조도 가능합니다. 현재는 세 앱과 로컬 D1/R2를 함께 사용하는 실행 구성을 유지하고, 한 서버가 저장소를 소유합니다. Next는 화면 렌더링·라우팅과 같은 출처의 `/api` 진입점을 제공합니다. 이는 독립 백엔드를 둔 구성으로, Next가 업무 API까지 직접 실행하는 구성과 구분합니다.

## 폴더별 책임

| 폴더              | 책임                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `http`            | Hono 앱 조립, 공통 미들웨어, JSON 입력과 응답·오류 처리           |
| `http/routes`     | 시스템·예약·인증·촬영·업로드·운영의 명시적 GET/POST 연결          |
| `runtime`         | Worker 진입점, D1·R2 바인딩 타입, 상태 확인과 로컬 시연 조회      |
| `database`        | D1 조회·batch와 촬영 버전 검사를 포함한 원자적 변경               |
| `security`        | 세션·쿠키·로그인 제한, 역할 검사, 토큰·해시, 전화번호 검증·마스킹 |
| `booking`         | 상품 조회, 디렉터 후보 선정, 예약 가능 일정, 신규 예약 접수       |
| `shoots`          | 촬영별 접근 범위, 역할별 목록·상세 응답, 업무 명령 실행           |
| `shoots/commands` | 상태·결제·준비·셀렉·보정·후속 관리별 검증과 저장할 SQL 준비       |
| `files`           | 파일 목록과 열람 권한, 이미지 검사, R2 업로드·다운로드            |
| `activity`        | 변경 이력·안내 템플릿·알림 수동 완료·후속 요청 조회               |
| `settings`        | 관리자 전용 기준 정보 조회·검증·변경과 변경 이력                  |
| `shared`          | 저장된 JSON을 기본값과 함께 읽는 내부 함수                        |

## 요청과 저장 흐름

1. `http/app.ts`가 Origin 검사, 공개 라우터, 인증 미들웨어, 보호 라우터를 순서대로 조립합니다. 기능별 `http/routes/*.ts`는 입력을 읽고 업무 함수를 호출해 응답하며 SQL을 실행하지 않습니다.
2. 인증 미들웨어가 세션의 종류·만료·고객 토큰 버전·활성 직원을 확인하고 검증한 `Actor`를 context에 넣습니다. 알림은 운영자, 설정은 관리자 미들웨어로 추가 제한합니다. 업무 함수도 역할·촬영·파일 범위를 검사합니다. 촬영 조회는 고객 본인, 담당 디렉터, 보정 작업 배정 범위를 SQL 조건으로 제한합니다.
3. `shoots/actions.ts`가 접근 가능한 촬영을 읽고 취소 여부와 명령 이름을 확인합니다. 각 명령 파일은 기존 입력·역할·업무 검증을 수행하고 실행할 SQL을 준비합니다.
4. 이미 처리된 상태 변경·결제 확인은 저장 없이 상세를 돌려줍니다. 그 외에는 한 실행부에서 상태와 이력 SQL을 추가하고 `database/mutations.ts`를 한 번 호출합니다.
5. 같은 D1 batch 안에서 촬영 버전과 결제·hold의 추가 조건을 검사한 뒤 업무 SQL, 버전 증가, guard 삭제를 수행합니다. 실패하면 전체 변경이 롤백됩니다. 명령 파일은 직접 commit하지 않습니다.
6. 상세 응답을 다시 조회하면서 역할별로 개인정보와 파일 공개 범위를 적용합니다.

신규 예약도 고객·촬영·슬롯·결제·이력을 하나의 batch로 저장하며 슬롯 중복 제약을 이용해 동시 예약을 제한합니다. 파일 업로드는 실제 이미지 형식과 크기를 검사하고 D1 저장 실패 시 해당 R2 객체를 삭제합니다. 로컬 시연 로그인과 데모 파일은 플래그와 localhost 조건을 모두 만족해야 합니다.

## Figma 화면에서 사용하는 저장 동작

- `GET /schedule?week=YYYY-MM-DD`는 실제 예약·hold·휴무·담당자와 주간 슬롯을 돌려줍니다. `assign_staff`는 필수 사유·추가서비스 자격·휴무·시간 중복을 검사하고 촬영과 슬롯을 함께 변경합니다.
- `save_preparation`·`mark_preparation_read`·`confirm_preparation`은 준비 안내와 고객별 읽음을 저장합니다. 모든 등록 안내를 읽기 전에는 전체 확인을 막습니다. 현장 체크8개와 셀렉 주체·변경 사유는 `save_field_checklist`로 저장하고, 충족 후 `complete_field`가 촬영을 완료합니다.
- `submit_selection`의 기본 장수 초과분과 `request_extra_retouch`는 추가 보정 상품의 현재 단가(미설정 기본10,000원)를 신규 주문에 저장합니다. 판매를 중단하면 신규 유료 초과/추가 신청만 거절하고 포함된 기본 셀렉과 기존 주문은 유지합니다. 고객의 입금 요청은 실제 입금 확인이 아니며 직원의 `confirm_payment` 이후에만 보정 작업을 만듭니다.
- `save_file_link`는 HTTPS 외부 링크를 검증합니다. R2 원본은 `uploads`, 외부 원본 링크는 `external_file_links`에서 공개 여부를 관리합니다. 둘 중 하나가 준비되면 후기 승인과 원본 공개를 처리할 수 있습니다. 후기 혜택은 활성 `review` 캠페인에만 접수하며, `review` 설정이 없는 기존 환경에서는 활성 `review-demo`를 사용합니다. `plan_ref` 사진은 설계 공유 전 비공개이며 후보·결과 사진의 의상 분류와 원본 후보 연결은 `photo_metadata`에 저장합니다.
- `GET/POST /settings`는 계좌·장소·가이드·휴무·상품·옵션·이벤트와 디렉터 수행 옵션/요일별 보정가 규칙을 관리합니다. 관리자만 변경하며 이전 값·다음 값·변경자를 기록합니다.
- `GET /templates`, `POST /templates/:key`는 수동 안내와 단계·패키지·옵션·담당 조건을 저장합니다. `GET /shoots/:id/messages`는 담당 촬영의 활성·조건 일치 안내만 치환하며 `POST /shoots/:id/messages/:templateKey/complete`는 고유 제약으로 수동 완료를 한 번만 기록합니다. 원문 개인 링크는 해시에서 복원하지 않으며 미확인 변수는 그대로 남깁니다. `POST /notifications/:id/complete`는 기존 운영 대기 기록을 처리합니다. 실제 카카오 메시지를 보내지 않습니다. `GET /followups`는 후기·추가보정 요청을 실제 데이터로 조회합니다.
- `GET /settings/history`는 관리자에게 직원 계정·설정·템플릿 변경 최근 100건의 작업과 변경 전후 값, 담당자를 제공합니다. 상품과 옵션의 활성 여부는 공개 목록과 신규 예약에 적용됩니다. 기존 촬영은 예약 당시의 가격과 옵션을 사용합니다.
- `operations_policy`는 입금 유지/마감·예약 노출 주 수·기존 슬롯 노출·설문/의상 기한을 신규 접수에 적용합니다. `catalog_rules`는 스팟·난이도·표기 별칭·옵션 수량/자격 규칙을 저장합니다. 설정과 상품 변경은 검증 이전에 읽은 JSON을 원자적 저장 시 다시 확인하고 경합하면 409로 거절합니다. 임의 시간대 추가·기존 예약 일괄 변경·만료 정리 자동 실행은 수행하지 않습니다.

추가 테이블은 `0002_figma_workflows.sql`, `0003_photo_retouch_orders.sql`에 있습니다. `0004_manual_templates.sql`은 안내 조건과 중복 완료 제약·원본 15종 안내 목록을 추가합니다. 원본에서 본문을 확인한 준비물 안내 외 항목은 검토 전 비활성 초안입니다. 기존 로컬 데이터에 `d1 migrations apply --local`로 적용하며 초기화/시드를 반복하지 않습니다.

미등록 경로와 지원하지 않는 method도 인증을 거친 뒤 404를 반환합니다(미인증은 401). 기존 계약에 맞춰 HEAD의 GET 자동 대체를 막고, 끝 슬래시 한 개만 허용하며 경로 매개변수는 한 번만 디코딩합니다. 예상하지 못한 오류는 세부 내용을 숨긴 JSON 500 응답으로 변환합니다. 파일 다운로드는 원래 `Response` 스트림을 전달합니다. 라우트 정의와 HTTP 회귀 검사는 [라우터](src/http/routes/)와 [서버 테스트](../../tests/backend.test.ts)에 있습니다.

## 환경과 검사

직원 계정은 관리자만 `GET /staff`, `POST /staff`, `POST /staff/:id`, `POST /staff/:id/revoke-sessions`로 조회·등록·변경·회수할 수 있습니다. 운영에서 등록할 주소는 `STAFF_EMAIL_DOMAIN`에 속해야 합니다. 등록된 직원은 로그인 화면에서 일회용 링크를 요청합니다. 역할·활성 변경과 세션 회수는 계정 버전을 확인하고, 세션과 미사용 링크를 폐기하는 작업 및 감사 기록을 같은 D1 batch에 저장합니다. 자기 역할과 활성 상태는 다른 관리자가 변경합니다. 기존 촬영 배정은 운영자가 필요한 경우 재배정합니다.

직원·설정·템플릿 변경은 `activity/audit.ts`의 `auditStatement()`로 행위자·작업·대상·이전/다음 값을 기록합니다. 관리자용 `/settings/history`는 기존 기록과 새 기록을 함께 조회합니다. API 장애와 직원 메일 전송 실패는 `runtime/log.ts`의 구조화 로그를 사용합니다. 요청 ID, 메서드, 오류 코드 등 정해진 필드만 운영 로그에 남깁니다.

이미 사용 중인 로컬 DB에는 `0007_audit_events.sql`, `0008_staff_account_lifecycle.sql`을 포함한 미적용 마이그레이션만 적용합니다. 루트에서 아래 명령을 실행합니다.

```sh
yarn wrangler d1 migrations apply manspick-local --local --config infra/wrangler.jsonc --persist-to .local/state
```

`Env`의 필수 바인딩은 `DB: D1Database`, `BUCKET: R2Bucket`입니다. 로컬 시연은 `LOCAL_DEMO`로만 활성화합니다. 운영 직원 로그인에는 `EMAIL` 바인딩과 `STAFF_APP_ORIGIN`, `STAFF_EMAIL_DOMAIN`, `STAFF_EMAIL_FROM`이 필요합니다. 고객 링크 발급에는 `CUSTOMER_APP_ORIGIN`을 사용합니다. Cloudflare 설정과 마이그레이션·시드 데이터는 `infra`에서 관리합니다. 운영 확인 절차는 [타사 납품과 운영](../../docs/reference/10-client-admin-architecture.md)에 있습니다. 자동 알림톡과 결제 공급자는 연결되지 않았습니다.

저장소 루트에서 실행합니다.

```sh
yarn typecheck
yarn exec eslint apps/server
node --test tests/backend.test.ts tests/domain.test.ts
yarn test:local
```

`test:local`은 로컬 Worker와 D1/R2, user·admin Next 앱이 실행 중이어야 합니다. DB 최초 초기화에만 `yarn db:init`을 사용하고 이후 `yarn dev`로 개발 서버들을 실행합니다. API만 확인할 때는 `yarn dev:server`를 사용합니다. 회귀 테스트는 공개·보호 경로와 입력/오류 계약, 인증·인가, 동시 예약, 결제·취소, 설문·촬영 설계, 셀렉·보정·후기, 비공개 원본과 업로드를 검증합니다.
