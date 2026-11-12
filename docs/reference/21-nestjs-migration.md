# NestJS 공통 API 전환

2026-11-12. 기존 Workers 실행을 유지하고 NestJS의 Node HTTP 호환 계층을 사용하는 것으로 확정했다.

## 변경 계획과 기준

1. 전환 전 `tests/backend.test.ts`, `tests/domain.test.ts` 63개를 실행해 기존 업무·인증·HTTP 계약을 고정한다. 결과: 63개 통과.
2. Hono 라우터를 NestJS 기능별 모듈·컨트롤러로 교체한다. Origin, 세션, 역할 검사와 예외 응답을 공통 계층에서 처리한다.
3. `@manspick/domain`, `@manspick/contracts`와 기존 업무 함수·D1 원자적 변경·R2 파일 보호를 재사용한다. 불필요한 서비스 래퍼와 데이터베이스 이관은 추가하지 않는다.
4. Cloudflare의 `node:http` 어댑터로 NestJS를 연결한다. 요청별 원본 URL·바인딩·사용자를 분리하고 Node 테스트와 실제 workerd 양쪽에서 검증한다.
5. 전체 테스트·타입·린트·포맷·빌드와 로컬 D1/R2 통합 검사를 수행한다. 검증된 변경을 커밋·푸시하고 기존 비공개 `manspick-api-test`에 배포한다.

기존 `/api` 경로, JSON envelope, 상태 코드, 쿠키, 128 KiB JSON 제한, Origin→인증→입력 검증 순서, 미등록 경로 인증, 단일 끝 슬래시와 한 번의 경로 디코딩, 파일 스트림을 보존한다. 스키마·기존 데이터·리소스 식별자는 변경하지 않는다.

## 실행 경계

NestJS는 Workers의 Node.js 호환 계층에서 실행하며 독립 Node 프로세스나 Container를 생성하지 않는다. Nest의 Workers 실행은 공식 지원 런타임이 아니므로 실제 workerd 회귀 검사를 배포 기준으로 삼는다. HTTP 외의 TCP microservice, WebSocket gateway, 프로세스 shutdown hook은 이 서버에 포함하지 않는다.

- [Cloudflare Node HTTP](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/)
- [NestJS Workers 안내](https://docs.nestjs.com/faq/cloudflare-workers)

운영 설정 파일은 아직 없고 `infra/wrangler.production.example.jsonc`만 있다. 이번 배포는 기존 관리자 테스트 서비스가 사용하는 `infra/wrangler.api-test.jsonc`를 대상으로 한다. 테스트 접근 제한과 `LOCAL_DEMO=false`를 유지한다.

## 검증과 배포 결과

- 기존 전환 전 업무·도메인 회귀: 63/63 통과.
- 전환 후 전체 테스트: 111/111 통과. 요청 문맥 누락, 본문 소유권, 대소문자, 잘못된 HEAD 경로, 서로 다른 저장소·역할의 동시 요청 회귀를 포함한다.
- 전체 typecheck, ESLint, Prettier, API와 세 프런트엔드 빌드 통과. 기존 Vinext source map·동적 import 경고는 남아 있다.
- 로컬 workerd 실행은 Windows 앱 제어 정책이 실행 파일을 차단해 완료하지 못했다. 정책을 우회하지 않았으며 실제 Cloudflare 테스트 배포에서 대체 검증했다.
- 기존 비공개 `manspick-api-test` 배포 완료: `bb936339-41cc-4260-a3c4-bdfd0570d49d`. 보고된 Worker 시작 시간 65 ms, 압축 번들 551.31 KiB.
- [관리자 테스트 앱](https://manspick-admin-test.winningant8.workers.dev)을 통한 실제 요청 49개 통과: D1 상태, JSON 로그인·크기 제한, 역할, 12개 동시 세션 요청, multipart 이미지 검사, R2 저장·바이트 일치 다운로드·익명 접근 거부, 복수 쿠키 로그아웃·세션 폐기.
- 검증 업로드는 기존 시연 촬영 `demo-preparation`의 `plan_ref`에 고정 멱등 키로 작은 PNG 한 장을 저장했다. 검사에서 만든 직원 세션은 로그아웃으로 폐기했다.
- 이전 복구 기준 버전: `82d601e5-0474-4f05-a6e7-cc0f9ff9944f`. 데이터 스키마 변경은 없다.

원격 경로 검사는 기존 Next 프록시를 통과한다. 이 프록시는 중복 슬래시를 API에 전달하기 전에 308로 정규화하므로, API 자체의 단일 끝 슬래시·잘못된 인코딩 계약은 직접 Nest HTTP 회귀 검사로 확인한다. 프런트엔드 폴더명 변경은 병행 작업으로 보존하고 이번 서버 커밋과 분리한다.
