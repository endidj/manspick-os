# @manspick/domain

맨즈픽이 촬영을 접수하고 진행할 때 지켜야 하는 업무 규칙을 담습니다. 화면, HTTP, Cloudflare, 데이터베이스에 의존하지 않으므로 API와 화면이 같은 상태 이름과 규칙을 사용할 수 있습니다.

## 공개 경로와 사용

`@manspick/domain` 하나의 경로로 함수와 타입을 공개합니다. `src/index.ts`는 재수출만 하며 구현은 목적별 파일에 있습니다.

```ts
import { assertTransition, requiredSlots, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';

const next: ShootStatus = 'outfit_checked';
assertTransition('addons_in_progress', next, 'director');
const slots = requiredSlots('one', '15:00', true);
const label = statusInfo(next).label;
```

| 파일                   | 담당하는 규칙                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `status.ts`            | 촬영 상태 30개와 취소 상태, 단계 이름, 상태 순서, 직원 역할                          |
| `transitions.ts`       | 정상 진행, 건너뛰기·되돌리기 사유, 역할별 변경 범위                                  |
| `booking.ts`           | 패키지·쇼핑에 필요한 슬롯, 내일부터 8주 이내 예약, 결제 대기 만료                    |
| `operations-policy.ts` | 신규 예약의 노출 주 수·기존 슬롯 노출·입금 유지/마감·설문/의상 제출 기준과 입력 검증 |
| `catalog.ts`           | 원본 스팟·난이도·상품 별칭, 패키지별 옵션 수량·노출과 의상 합계 검증                 |
| `preparation.ts`       | 필요한 의상 사진 수와 설문·의상 준비 마감                                            |
| `dates.ts`             | 업무 규칙에서 사용하는 한국 날짜와 날짜 이동                                         |
| `errors.ts`            | 오류 코드·메시지·상태를 담는 `DomainError`                                           |

## 경계

외부 패키지 의존성이 없습니다. `server`, `contracts`, `web`, `design-system`을 가져오지 않습니다. 날짜 계산은 예약·준비 규칙에서 실제 사용하는 공통 계산이므로 이 안에 둡니다. 일반 전화번호 정규화와 개인정보 마스킹은 업무 상태 규칙이 아니므로 API의 `security/phone.ts`에서 처리합니다.

서버는 HTTP 입력을 검증한 뒤 이 패키지의 업무 규칙을 적용하고 D1에 저장합니다. 화면은 상태 이름과 표시 정보를 사용할 수 있지만 서버의 접근 제어와 저장 전 검증을 대신하지 않습니다.

예약 계산 함수의 선택적 정책 인자는 기존 기본값을 유지합니다. 숨긴 시작 시간도 올데이·쇼핑의 기존 점유 기준에는 남습니다. 설정 저장·이력·상품 가격 조회는 서버가 소유하며 이 패키지는 DB를 읽지 않습니다. 하/중/상의 숫자 환산과 디렉터 난이도 수용치는 정의되지 않았으므로 배정 점수를 만들지 않습니다.

## 검사

저장소 루트에서 실행합니다.

```sh
yarn typecheck
yarn exec eslint packages/domain
node --test tests/domain.test.ts tests/backend.test.ts
```

날짜 경계, 슬롯·hold 정책, 상태 전이와 서버의 실제 업무 흐름을 함께 확인합니다. 이 리팩토링은 기존 상태 순서, 오류, 마감 계산을 보존합니다.
