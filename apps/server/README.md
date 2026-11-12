# @manspick/server

고객·직원의 인증과 권한, 촬영 업무 명령, D1 데이터와 R2 파일을 소유하는 NestJS 12.4.2 서버입니다. Express 어댑터와 Cloudflare의 Node HTTP 호환 계층을 통해 Workers에서 실행됩니다. `apps`는 화면 유무와 관계없이 독립 배포하는 서비스를 뜻하며, 세 Next 앱이 같은 API를 사용합니다.

## 실행과 공유 경계

`src/worker.ts`는 `runtime/worker-handler.ts`의 요청 처리기를 Cloudflare에 연결합니다. 요청 처리기는 Nest 앱을 isolate마다 한 번 초기화하고 `cloudflare:node`의 `handleAsNodeRequest()`로 Node HTTP 서버에 요청을 전달합니다. `http/app.ts`가 공통 HTTP 설정을 적용하고 `app.module.ts`가 기능별 모듈을 조립합니다. Node HTTP에는 본문 없는 라우팅 요청을 전달하고, 원본 본문은 인증 이후 기존 Fetch 파서가 한 번만 읽습니다. 원본 Fetch `Request`와 D1·R2 바인딩, 검증된 행위자는 `AsyncLocalStorage` 기반 `RequestContext`로 요청마다 분리합니다.

화면 앱은 이 실행부를 import하지 않습니다. 요청·응답 타입은 `@manspick/contracts`에서 `import type`으로 공유하며, 순수 업무 규칙은 `@manspick/domain`을 재사용합니다. 브라우저 요청과 Next 프록시는 `@manspick/web`이 맡습니다. Nest는 HTTP 라우팅·모듈 조립·가드·예외 처리를 소유하고, 기존 업무 함수는 application service 역할을 유지합니다. 함수 호출만 감싸는 서비스 클래스나 새 저장소 추상화는 추가하지 않습니다.

```sh
yarn dev:server
yarn workspace @manspick/server typecheck
yarn workspace @manspick/server build
```

루트 `infra/wrangler.jsonc`가 이 서버를 직접 실행합니다. 서버의 build는 원격 배포 없이 `.local/build/server`에 Worker를 묶는 dry-run입니다. 로컬 상태는 기존 루트 `.local/state`를 그대로 사용하며 DB·bucket 식별자를 바꾸지 않습니다.

### 런타임과 배포 범위

배포 런타임은 Node API를 지원하는 `workerd`이며 독립 Node.js 프로세스가 아닙니다. Cloudflare는 Node HTTP 서버 연결을 지원하지만 Nest는 Workers를 공식 지원 대상으로 보장하지 않습니다. 따라서 Node 테스트와 함께 Wrangler 로컬 실행 및 실제 Cloudflare 요청을 검증해야 합니다. Nest shutdown hook, WebSocket gateway, TCP microservice는 이 실행 구성의 지원 범위에 포함하지 않습니다. [Cloudflare Node HTTP](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/) · [Nest Workers 안내](https://docs.nestjs.com/faq/cloudflare-workers)

Wrangler의 esbuild는 생성자 타입에 대한 decorator metadata를 만들지 않습니다. 주입이 필요한 의존성은 명시적 `@Inject()` 토큰 또는 factory provider로 선언하고, `reflect-metadata`는 Nest 초기화 전에 불러옵니다. HTTP 매개변수는 `@ApiContext()` 등 명시적 데코레이터로 전달합니다. 번들에서 제외한 Nest 선택 기능을 사용하려면 의존성과 빌드 설정을 함께 검토합니다.

현재 원격 설정은 `infra/wrangler.api-test.jsonc`의 비공개 `manspick-api-test`입니다. `infra/api-test.ts`는 관리자 surface 요청만 받아 `LOCAL_DEMO=false`, `ADMIN_TEST=true`로 실행합니다. 기존 D1·R2와 Service Binding을 유지하며 API에 공개 주소를 추가하지 않습니다. `infra/wrangler.production.jsonc`는 저장소에 없고 운영 예시만 있으므로 테스트 배포를 운영 배포로 표현하지 않습니다. 전환 계획과 검증 기록은 [NestJS 마이그레이션](../../docs/reference/21-nestjs-migration.md)을 참고합니다.

## Next와 나눈 이유

공통 업무 코드를 공유하는 데 별도 서버가 반드시 필요한 것은 아닙니다. 각 Next Route Handler가 공유 함수를 직접 실행하는 구조도 가능합니다. 현재는 세 앱과 로컬 D1/R2를 함께 사용하는 실행 구성을 유지하고, 한 서버가 저장소를 소유합니다. Next는 화면 렌더링·라우팅과 같은 출처의 `/api` 진입점을 제공합니다. 이는 독립 백엔드를 둔 구성으로, Next가 업무 API까지 직접 실행하는 구성과 구분합니다.

## 폴더별 책임

| 폴더                                   | 책임                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `app.module.ts`                        | 기능 모듈과 공통 가드·예외 처리 조립                                         |
| `http`                                 | Nest 부팅, 요청 문맥, 접근 데코레이터·가드, JSON 입력과 Fetch 응답·오류 변환 |
| 기능별 `*.module.ts`·`*.controller.ts` | 기능별 경로와 입력을 연결하고 기존 업무 함수를 호출                          |
| `runtime`                              | Worker의 Node HTTP 연결, D1·R2 바인딩 타입, 상태 확인과 로컬 시연 조회       |
| `database`                             | D1 조회·batch와 촬영 버전 검사를 포함한 원자적 변경                          |
| `security`                             | 세션·쿠키·로그인 제한, 역할 검사, 토큰·해시, 전화번호 검증·마스킹            |
| `booking`                              | 상품 조회, 디렉터 후보 선정, 예약 가능 일정, 신규 예약 접수                  |
| `shoots`                               | 촬영별 접근 범위, 역할별 목록·상세 응답, 업무 명령 실행                      |
| `shoots/commands`                      | 상태·결제·준비·셀렉·보정·후속 관리별 검증과 저장할 SQL 준비                  |
| `files`                                | 파일 목록과 열람 권한, 이미지 검사, R2 업로드·다운로드                       |
| `activity`                             | 변경 이력·안내 템플릿·알림 수동 완료·후속 요청 조회                          |
| `settings`                             | 관리자 전용 기준 정보 조회·검증·변경과 변경 이력                             |
| `shared`                               | 저장된 JSON을 기본값과 함께 읽는 내부 함수                                   |

## 요청과 저장 흐름

1. Worker 처리기가 원본 요청과 바인딩으로 요청 문맥을 만듭니다. `http/app.ts`가 본문 처리 전에 Origin을 검사합니다. 기능별 Nest 컨트롤러는 입력을 읽고 업무 함수를 호출해 응답하며 SQL을 실행하지 않습니다.
2. `http/access.ts`의 `AccessGuard`가 세션과 역할을 검사합니다. 공개 경로는 `@Public()`, 추가 역할 제한은 `@RequireRole()`로 선언합니다. 세션의 종류·만료·고객 토큰 버전·활성 직원을 확인한 `Actor`를 요청 문맥에 넣고 컨트롤러가 `@ApiContext()`로 사용합니다. 알림은 운영자, 설정은 관리자로 제한합니다. 업무 함수도 역할·촬영·파일 범위를 검사하며 촬영 조회는 고객 본인, 담당 디렉터, 보정 작업 배정 범위를 SQL 조건으로 제한합니다.
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

미등록 경로와 지원하지 않는 method도 인증을 거친 뒤 404를 반환합니다(미인증은 401). 기존 계약에 맞춰 HEAD의 GET 자동 대체를 막고, 끝 슬래시 한 개만 허용하며 경로 매개변수는 한 번만 디코딩합니다. 예상하지 못한 오류는 `http/exception.filter.ts`가 세부 내용을 숨긴 JSON 500 응답으로 변환합니다. `http/express.adapter.ts`는 업무 함수의 Fetch `Response`를 HTTP 응답으로 전달하고 파일 본문을 스트리밍합니다. 기능별 경로는 각 컨트롤러에 있으며 [앱 모듈](src/app.module.ts)과 [서버 테스트](../../tests/backend.test.ts)에서 연결과 계약을 확인할 수 있습니다.

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
yarn test
yarn test:local
```

`yarn test`는 `tsx`로 Nest 데코레이터를 변환해 Node 테스트 러너를 실행합니다. `tests/helpers/server.ts`는 실제 Nest·Express 앱에 `light-my-request`로 HTTP 요청을 주입하므로 컨트롤러·가드·예외 처리 경로를 함께 검사합니다. Fetch 응답을 직접 반환하는 가짜 라우터를 별도로 유지하지 않습니다.

`test:local`은 로컬 Worker와 D1/R2, user·admin Next 앱이 실행 중이어야 합니다. DB 최초 초기화에만 `yarn db:init`을 사용하고 이후 `yarn dev`로 개발 서버들을 실행합니다. API만 확인할 때는 `yarn dev:server`를 사용합니다. 회귀 테스트는 공개·보호 경로와 입력/오류 계약, 인증·인가, 동시 예약, 결제·취소, 설문·촬영 설계, 셀렉·보정·후기, 비공개 원본과 업로드를 검증합니다. 배포 후에는 관리자 테스트 앱의 `/api/health`와 대표 인증·파일 요청으로 Cloudflare의 실제 Node HTTP 연결을 확인합니다.
