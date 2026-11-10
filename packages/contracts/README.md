# @manspick/contracts

세 Next 앱과 공통 서버가 공유하는 요청·응답·세션 타입입니다. HTTP 처리·인증·DB·Cloudflare 실행 코드는 포함하지 않습니다. 타입이 참조하는 촬영 상태와 직원 역할은 기존 `@manspick/domain`이 소유합니다.

```ts
import type { ShootDetail, SessionDTO, ShootAction } from '@manspick/contracts';
```

공개 경로는 `@manspick/contracts` 하나입니다. `src/index.ts`는 타입만 재수출합니다. 값 import와 런타임 구현은 린트로 차단하므로 브라우저가 계약을 사용하려고 서버 실행부에 의존하지 않습니다.

계약 변경은 `src/contracts.ts`에서 하고, 서버와 앱의 타입 검사 및 관련 HTTP 회귀 검사를 함께 실행합니다. 새 타입을 만들기 전 기존 DTO와 도메인 타입을 먼저 확인합니다.

상품 DTO의 스팟·난이도·별칭·옵션 수량 규칙은 기존 예약 스냅샷과 호환되도록 선택 항목입니다. 관리자 설정의 `policy`는 도메인의 `OperationsPolicy` 타입을 참조합니다. 촬영 상세의 `retouchUnitPrice`·`extraRetouchAvailable`은 현재 추가 주문의 단가·판매 상태이며, 이미 접수한 주문 금액은 결제 DTO에 저장한 값을 사용합니다.
