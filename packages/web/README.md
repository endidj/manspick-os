# @manspick/web

세 Next 앱이 공통으로 사용하는 **웹 연결 도구**입니다. 업무 규칙이나 데이터 저장을 소유하지 않습니다.

| 공개 경로              | 역할                                                                    | 실행 위치     |
| ---------------------- | ----------------------------------------------------------------------- | ------------- |
| `@manspick/web/client` | `api`, `action`, `ApiError`: 같은 앱의 `/api` 호출, 세션 쿠키·오류 처리 | 브라우저      |
| `@manspick/web/format` | `money`, `dateTime`: 원화·서울 시간 표시                                | 브라우저·서버 |
| `@manspick/web/proxy`  | `proxyRequest`: Next Route Handler에서 API Worker로 전달                | Next 서버만   |

```text
src/
  client/   브라우저 요청과 API 오류
  format/   화면 표시용 순수 함수
  proxy/    Cloudflare Workers Service Binding·로컬 API 연결
```

각 폴더의 `index.ts`는 공개 기능의 재수출만 담당합니다. 금액·날짜는 요청 기능과 무관하므로 `client`에서 분리했습니다. 새 util 패키지를 만들지 않고 실제 웹 표시 책임 안에 둡니다.

`dateTime(value)`는 기존의 긴 날짜 표시를 유지합니다. 좁은 운영 카드에는 `dateTime(value, 'compact')`를 사용해 `11/6 (금) 09:30`으로 표시합니다. 두 형식 모두 서울 시간을 사용하며 일정이 없으면 `일정 선택 전`을 반환합니다.

## server와 나누는 이유

`apps/server`는 D1/R2와 세션·권한을 다루는 독립 서버입니다. `web`은 세 Next 앱을 그 서버에 연결합니다. 브라우저에서 가져오는 `client`/`format`에 Workers 런타임·DB·인증 구현이 섞이지 않도록 공개 경로와 린트 경계를 나눴습니다. `proxy`는 서버에서만 가져옵니다.

`api()`는 이 패키지의 브라우저 요청 함수입니다. 요청은 `api()` → Next의 `proxyRequest()` → 서버 Worker의 `handleRequest()` 순서로 전달됩니다. 계약 타입은 `@manspick/contracts`에서 가져옵니다. [서버 README](../../apps/server/README.md)

```tsx
// Client Component
import { api, ApiError } from '@manspick/web/client';
import { money } from '@manspick/web/format';

// app/api/[...path]/route.ts (서버)
import { proxyRequest } from '@manspick/web/proxy';
export const GET = (request: Request) => proxyRequest(request, 'user');
```

Vinext의 로컬 Worker와 운영 Worker는 `cloudflare:workers`에서 `MANSPICK_API` Service Binding을 가져옵니다. Worker 밖에서 Node로 테스트할 때는 `MANSPICK_LOCAL_API=true`로 `127.0.0.1:8787`에 연결하는 경로를 선택할 수 있습니다. landing은 공개 catalog/health만 전달합니다. 응답은 비공개 캐시 정책을 유지하며, fetch가 압축 해제한 응답의 압축·길이 헤더를 제거합니다.

## 검사

저장소 루트에서 `yarn test`, `yarn typecheck`, `yarn lint`, `yarn format:check`, `yarn build`를 실행합니다. 테스트는 JSON/FormData·오류·통화/시간·프록시 권한/헤더를 확인합니다. `yarn dev` 실행 후 `yarn test:local`은 실제 Next→Worker→D1/R2 연결을 검사합니다.
