# 랜딩·고객 공개 테스트

2026-11-12. 기존 관리자 테스트와 분리한 공개 테스트 환경이다. 실제 고객·발송·결제 시스템을 연결하지 않고 기존 가상 데이터만 사용한다.

## 연결과 데이터 경계

- 랜딩: https://manspick-landing-test.winningant8.workers.dev
- 고객: https://manspick-customer-test.winningant8.workers.dev
- API: 비공개 `manspick-public-api-test`. workers.dev와 preview URL을 비활성화하고 랜딩·고객 Service Binding 요청만 허용한다.
- D1: `manspick-public-test-db`, R2: `manspick-public-test-media`. 관리자 테스트와 바인딩·데이터를 공유하지 않는다.
- 로컬 시연과 관리자 테스트 권한은 강제로 비활성화한다. 고객 링크·뒤 4자리·세션·촬영 소유권·파일 공개 여부를 기존 Nest 가드와 업무 함수가 검사한다.
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

새 예약은 접수되지만 자동 알림톡은 연결하지 않았다. 개인 링크를 신규 예약 응답에 공개하는 로컬 우회도 열지 않았다. 관리자 테스트에서 만든 세션·예약은 이 환경에서 사용할 수 없다.

## 배포 검증 결과

정적 CSS 응답이 200이어도 페이지 HTML에 연결되지 않으면 화면이 깨질 수 있다. 배포 후 아래 명령으로 실제 stylesheet 링크에 공통 토큰·리셋·폰트 선언이 포함됐는지 확인하고, 브라우저에서 데스크톱·모바일의 계산된 스타일과 배치를 함께 검사한다.

```sh
node scripts/check-frontend-styles.mjs https://manspick-landing-test.winningant8.workers.dev/ https://manspick-landing-test.winningant8.workers.dev/recommend https://manspick-landing-test.winningant8.workers.dev/legal https://manspick-customer-test.winningant8.workers.dev/start https://manspick-customer-test.winningant8.workers.dev/s/demo-payment-access https://manspick-admin-test.winningant8.workers.dev/
```

Vinext의 서버 CSS 감지가 import 경로 확장자를 사용하므로 루트 layout은 `@manspick/design-system/styles.css`를 가져온다. 확장자가 없는 `/styles`는 빌드 파일만 생성하고 HTML 연결을 누락할 수 있다.

- 전체 테스트 113개, typecheck, ESLint, Prettier 통과. 네 프런트엔드 빌드와 새 API의 Wrangler dry-run을 확인했다.
- 실제 Cloudflare 주소에서 69개 확인 통과: 페이지·정적 자산, 예약 화면 이동·상품·달력, D1 상태, 네 가상 고객 로그인·소유 촬영 목록·다른 촬영 차단, 관리자 DB와의 세션 격리, R2 바이트·공개 여부, 로그아웃과 세션 폐기.
- 검사에서 생성한 고객 세션은 모두 로그아웃으로 폐기했다.
- API 버전: `14c2b10b-6909-4854-b70e-12b54ab6ea01`
- 랜딩 버전: `06cd0a32-50b6-4c9e-8e65-f876df019a60`
- 고객 버전: `93870bd4-99c5-4dd4-8e38-26a38cd30c8b`
- 기존 관리자·Empty도 새 폴더의 빌드로 갱신했다. 각각 `e77b27af-1f60-4698-ab83-715af5be22b4`, `51daceef-e5a4-4323-8f74-86d9e3c5aa6b`다.
