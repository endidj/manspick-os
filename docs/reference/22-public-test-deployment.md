# 랜딩·고객·관리자 통합 테스트

2026-11-16. 세 페이지가 같은 API·DB·사진 저장소를 사용하는 공개 테스트 환경이다. 실제 고객·발송·결제 시스템을 연결하지 않고 테스트 데이터만 사용한다. 관리자 테스트 로그인은 비밀번호 없는 역할 선택 방식이므로 실제 고객 정보를 입력하지 않는다.

## 연결과 데이터 경계

- 랜딩: https://manspick-landing-test.winningant8.workers.dev
- 고객: https://manspick-customer-test.winningant8.workers.dev
- 관리자: https://manspick-admin-test.winningant8.workers.dev
- API: 비공개 `manspick-public-api-test`. workers.dev와 preview URL을 비활성화하고 세 앱의 Service Binding 요청만 허용한다.
- D1: `manspick-public-test-db`, R2: `manspick-public-test-media`. 세 앱이 공유하므로 고객에서 만든 예약과 저장한 설문을 관리자에서 확인한다.
- 로컬 시연은 강제로 비활성화하고 관리자 테스트 권한은 admin surface에만 적용한다. 각 프런트 프록시는 surface 헤더를 고정한다. 고객 링크·뒤 4자리·세션·촬영 소유권·파일 공개 여부는 기존 Nest 가드와 업무 함수가 검사하며 고객과 관리자 쿠키는 서로 사용할 수 없다.
- 2026-11-27에 이전 관리자 전용 Worker(`manspick-api-test`), D1(`manspick-admin-test-db`), R2(`manspick-admin-test-media`)를 백업 없이 삭제했다. 삭제 후 세 앱의 `/api/health`가 모두 HTTP 200을 반환했고, Cloudflare 목록에서 공통 테스트 D1과 R2가 각각 하나씩 남은 것을 확인했다.
- test 모드의 Vite 설정에서 앱 간 주소를 지정한다. 고객 홈은 test 모드에서만 `/start`로 이동하며 로컬 시연 홈은 유지한다.

## 배포와 최초 데이터 준비

다음 초기 데이터 명령은 생성된 **빈 공개 테스트 DB에서 한 번만** 실행한다. 기존 데이터를 삭제하거나 초기화하지 않는다.

```sh
yarn wrangler d1 migrations apply manspick-public-test-db --remote --config infra/wrangler.public-test.jsonc
yarn wrangler d1 execute manspick-public-test-db --remote --config infra/wrangler.public-test.jsonc --file infra/seed.sql --yes
yarn db:public-test:media
yarn deploy public-server-test
yarn deploy landing-page-test
yarn deploy customer-page-test
yarn deploy admin-page-test
```

사진 준비 명령은 기존 seed의 `demo/` 키 15개에 1,000바이트 SVG 가상 사진을 저장한다. 반복하면 같은 가상 사진만 덮어쓴다. 고객의 일반 업로드 파일은 건드리지 않는다.

프런트엔드 배포 명령은 `cf auth login`, API·DB·R2 명령은 Wrangler 인증을 사용한다. 인증 저장소가 다르다. 이번 릴리스에서는 기존 Wrangler 인증으로 test 모드의 Cloudflare Build Output을 배포했고, Worker 이름·Service Binding·assets 설정을 생성된 worker.config.json과 대조했다.

## 가상 고객 확인

| 상태      | 개인 링크                                                                                     | 전화번호 뒤 4자리 |
| --------- | --------------------------------------------------------------------------------------------- | ----------------- |
| 입금 대기 | [가상 예약](https://manspick-customer-test.winningant8.workers.dev/s/demo-payment-access)     | 1001              |
| 촬영 준비 | [가상 준비](https://manspick-customer-test.winningant8.workers.dev/s/demo-preparation-access) | 1002              |
| 사진 선택 | [가상 셀렉](https://manspick-customer-test.winningant8.workers.dev/s/demo-selection-access)   | 1003              |
| 보정 결과 | [가상 결과](https://manspick-customer-test.winningant8.workers.dev/s/demo-result-access)      | 1004              |

새 예약은 관리자 고객 목록에 표시된다. 공개 테스트 Worker는 고객 surface의 신규 예약에 한해 `bookingAccess.token`을 반환한다. 고객은 접수 완료 화면에서 입금 안내로 이동하고 전화번호 뒤 4자리로 인증한다. 직원이 실제 테스트 결제를 확인한 다음 설문을 작성할 수 있다. `LOCAL_DEMO`는 계속 꺼져 있으며 고객·관리자 세션 쿠키는 각 앱에서만 사용한다.

이 기능은 가상 데이터만 사용하는 테스트 환경의 예외다. 신규/중복 접수를 응답으로 구분할 수 있으므로 실제 고객 정보를 사용하지 않는다. 일반 운영 API는 신규/중복 모두 같은 응답을 유지한다. 중복 접수에는 기존 개인 링크를 반환하거나 재발급하지 않는다. 이미 접수한 건은 관리자가 고객 상세에서 링크를 발급해 안내한다. 링크를 재발급하면 기존 링크와 세션은 무효화된다. 자동 알림톡은 연결하지 않았다.

## 예약 DB 갱신 (2026-11-27)

기존 공통 테스트 DB에는 새 마이그레이션만 적용한다. `0013_catalog_columns.sql`이 상품 컬럼명을 변경하므로 DB 갱신 직후 같은 릴리스의 비공개 API Worker를 배포하고 세 프런트엔드를 갱신한다. 신규 DB 초기화용 시드는 기존 DB에 다시 실행하지 않는다.

고객이 여러 희망 일시를 신청하면 담당 디렉터가 설문 제출 후 그중 한 일시와 장소를 확정한다. 고객 입금 신고와 직원 수납 확인은 별개다. 과거 셀렉·보정 샘플 링크는 현재 촬영 진행 화면을 사용한다. 내부 사진은 직원이 업로드하고 조회한다. 테스트용 주문과 발송 대기 기록으로 검증하며 PG와 카카오 메시지 발송은 연결하지 않았다.

## 이전 분리 환경 검증 기록 (2026-11-12)

- 전체 테스트 113개, typecheck, ESLint, Prettier 통과. 네 프런트엔드 빌드와 새 API의 Wrangler dry-run을 확인했다.
- 실제 Cloudflare 주소에서 69개 확인 통과: 페이지·정적 자산, 예약 화면 이동·상품·달력, D1 상태, 네 가상 고객 로그인·소유 촬영 목록·다른 촬영 차단, 관리자 DB와의 세션 격리, R2 바이트·공개 여부, 로그아웃과 세션 폐기.
- 검사에서 생성한 고객 세션은 모두 로그아웃으로 폐기했다.
- API 버전: `14c2b10b-6909-4854-b70e-12b54ab6ea01`
- 랜딩 버전: `06cd0a32-50b6-4c9e-8e65-f876df019a60`
- 고객 버전: `93870bd4-99c5-4dd4-8e38-26a38cd30c8b`
- 기존 관리자·Empty도 새 폴더의 빌드로 갱신했다. 각각 `e77b27af-1f60-4698-ab83-715af5be22b4`, `51daceef-e5a4-4323-8f74-86d9e3c5aa6b`다.

## 통합 배포 검증 (2026-11-16)

- 고객 테스트의 기존 예약 5건(가상 샘플 4건과 사용자가 테스트 데이터로 확인한 예약 1건)을 공통 DB에서 유지했다. 이전 관리자 전용 DB·R2는 삭제하거나 초기화하지 않았다.
- 전체 회귀 127개, TypeScript·ESLint·Prettier, Storybook 상호작용·접근성 78개, 실제 고객 빌드의 브라우저 경로·설문 검사 23개가 통과했다.
- 세 프런트의 test 빌드와 공통 API dry-run을 확인하고 기존 Wrangler 인증으로 배포했다. 생성된 worker.config.json과 배포 설정의 Worker 이름·API 바인딩·assets 설정을 대조했다.
- 실제 Cloudflare에서 104개 확인 통과: 고객 예약 → 관리자 목록 → 고객 링크 발급·인증 → 관리자 입금 확인 → 고객 상태 변경 → 고객 설문 임시 저장 → 관리자 동일 응답 조회.
- 고객 경로의 관리자 헤더 위조·교차 쿠키·다른 고객 촬영·파일 접근·잘못된 Origin 차단과 기존 R2 파일을 확인했다. 배포된 6개 화면의 실제 CSS·공통 폰트 연결도 통과했다.
- 브라우저의 관리자 고객 보드에서 기존 고객 예약이 샘플들과 함께 표시되는 것을 확인했다.
- 검증용으로 새로 만든 예약만 '연동 검증 완료' 사유로 취소해 슬롯을 해제했다. 원래 5건의 내용이 유지됨을 확인하고 검증 스크립트가 생성한 3개 세션을 모두 폐기했다.
- API 버전: `7dcf350a-7ae6-44f8-b1fa-671ec7e63b62`
- 랜딩 버전: `e75cc1b9-e897-46a6-9487-f6f9b43beb05`
- 고객 버전: `d95102fb-74ee-4548-a41a-921ae4acd801`
- 관리자 버전: `4dd97be2-42f5-4d84-bca8-c4a23c00f07a`

관리자 테스트 로그인과 자동 알림 미연결은 그대로다. 실제 운영 전에는 직원 인증·발송 설정을 별도로 완료해야 한다.
