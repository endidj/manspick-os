# 맨즈픽 운영 사이트 React 포팅

## 원본과 완료 기준

기준은 [www.manspick.co.kr](https://www.manspick.co.kr/)와 [JeongWhale/manspick-site@54f4a375](https://github.com/JeongWhale/manspick-site/tree/54f4a375b5c3babe9f9bb82ac423c4be6686fb60)이다. 2026-11-16 대조에서 HTML/CSS/JS·추천·약관·개인정보 7파일은 줄바꿈 외 동일하고 사진 72개도 SHA-256이 일치했다. 첫 포팅의 공용 컴포넌트 중심 재해석은 폐기하고 원본 화면·애니메이션 보존으로 교체했다.

고정 인물 배경·grain·헤더·Hero·마퀴·진단 차트·6사례·카운터·알림 스택·5 HOW·팀 슬라이드/갤러리·양방향 후기·과정·3가격 카드·11FAQ·최종 CTA·상담 모달·floating CTA·푸터를 원본 순서대로 제공한다. 추천·이용약관·개인정보처리방침도 원본을 기준으로 옮긴다.

## 아키텍처

React 서버 컴포넌트를 역할별로 분리하며 HTML 문자열 삽입을 사용하지 않는다. 효과는 `SourceExperience`의 수명에 연결하고 선택자 범위를 root로 제한한다. 구독·타이머·RAF·관찰자·Chart 인스턴스와 모달 상태를 정리한다. 실제 원본에서 사용하지 않는 Motion CDN, portrait-grid, before/after toggle 코드는 가져오지 않는다.

원본 Tailwind의 정적 CSS와 style.css를 CSS Module로 범위 제한한다. 실제 원본 로드 순서(style.css → 생성 utility)를 보존한다. 공유 폰트·아이콘·자산 export와 별도 원본 타입/색상 토큰을 사용한다. 원본 사진은 `packages/design-system/src/assets/site/originals`에 해시와 함께 보관한다. Chart.js 4.6.1은 원본의 기존 라이브러리로, MIT 라이선스·버전·SHA-256을 보존해 자체 호스팅한다. 신규 npm 의존성은 없다.

상담용 가격·옵션은 `marketing-offers.ts`에 분리한다. 고객·관리자·서버의 실제 예약 상품, 인증·사진 권한, D1/R2 데이터는 수정하지 않는다. 기존 API 프록시와 domain의 예약 규칙은 유지한다.

## 원본과 다른 부분

- 사진 파일명 대소문자 오류 `team-influencer-7.jpg` → 실제 `7.JPG` 수정.
- 추천에서 의류 관심 선택 후 수량 0·중복 가산되던 원본 오류 수정. 최초 표시 합계는 원본과 같다.
- Google Form은 동의·검증 후 native POST와 새 탭 접수 확인으로 처리한다. 성공 여부를 추정하지 않는다. 테스트는 전송을 가로챈다.
- 모달 키보드·포커스·스크롤 복구, reduced-motion, JavaScript 없는 본문 가독성 보완.
- GA/GTM 추적은 이식하지 않는다. SEO 메타데이터는 서버에서 제공하지만 모든 앱의 색인은 금지한다.

잔여석·열람자·최근 신청·할인 종료 표시는 원본의 프런트엔드 시뮬레이션을 보존한다. 실제 API 재고나 예약 변경으로 취급하지 않는다. 구형 `/legal`은 `/terms`로 이동하며 이전 랜딩의 별도 셸과 중복 정책 화면은 제거했다.

## 검색 제외

landing/customer/admin/empty/Storybook 전체에 meta noindex와 HTTP `X-Robots-Tag: noindex, nofollow, noarchive, noimageindex`를 적용한다. 구 환경변수 `NEXT_PUBLIC_SITE_INDEXABLE=true`로도 해제되지 않는다. robots.txt는 `Allow: /`로 noindex를 읽게 하고 랜딩 sitemap은 비워둔다. 정적 자산은 `_headers`, SSR은 Next headers 설정으로 처리한다. 고객 `/s`의 `private, no-store`와 `no-referrer`를 유지한다.

구형 `/index.html`, `/recommend.html`, `/terms.html`, `/privacy.html`은 정식 React 경로로 308 이동하며 query를 보존한다.

## 검증 기록

2026-11-16 최종 소스에서 전체 TypeScript·ESLint·변경 파일 Prettier, 단위 검사 143개, 메인/추천 브라우저 검사 7개를 통과했다. 브라우저 검사는 320/390/768/1440px 넘침, 원본 가격·옵션·효과, 모든 이미지 decode, JavaScript 없는 SSR, Google POST 가로채기를 포함한다.

- 원본 감사: `.local/live-reference/comparison.json`, `parity-checklist.md`.
- 1440/390px 원본/로컬 화면·좌표·픽셀 비교: `.local/landing-parity`, `.local/recommend-parity`.
- 실제 동작 회귀: `tests/landing-site.browser.test.mjs`, `tests/landing.browser.test.mjs`.
- 검색 정책 회귀: `tests/landing-seo.test.ts`, `tests/search-visibility.test.ts`.
- 3개 SSR 앱 배포용 프리뷰 실제 GET의 루트·하위 경로·404·API·정적 파일에 전체 X-Robots-Tag 확인. Vinext dev 응답에는 이 설정이 생략되므로 빌드 프리뷰/배포 응답으로 판단한다.

## 배포 검증 (2026-11-16)

공개 저장소의 기존 이력을 유지한 `82f2b26`과 배포 CSS 보완 `204a7cc`를 `main`에 푸시하고 아래 기존 테스트 Workers에 배포했다. 공개본에서 TypeScript·ESLint·Prettier와 단위 검사 143개, 원본 사진 72개의 SHA-256 검사를 통과했다. 다섯 앱 빌드와 Wrangler dry-run도 통과했다. 격리 작업 폴더 외부의 의존성 연결을 Turbopack이 제한하여 empty 앱은 같은 Next.js의 `build --webpack`으로 빌드했다.

| 앱        | 실제 배포 주소                                            | Worker 버전                            |
| --------- | --------------------------------------------------------- | -------------------------------------- |
| 랜딩      | <https://manspick-landing-test.winningant8.workers.dev>   | `e17ee510-4504-4013-90c9-cd159e772cf4` |
| 고객      | <https://manspick-customer-test.winningant8.workers.dev>  | `59e7ac0d-a507-41be-ba16-d873652f2e0d` |
| 관리자    | <https://manspick-admin-test.winningant8.workers.dev>     | `a2633ba6-a8ec-46a2-9ed7-cea1021c909d` |
| Empty     | <https://manspick-empty-test.winningant8.workers.dev>     | `f48796f9-8cde-4902-b6dd-a3d8f6cc177a` |
| Storybook | <https://manspick-storybook-test.winningant8.workers.dev> | `d112c69f-d9e6-4b7a-9952-64160dfd3c09` |

실제 배포 주소의 HTML·정적 파일·robots·하위 경로·404/API 등 27개 응답에서 네 가지 X-Robots-Tag 지시어를 확인했다. 고객 개인 링크의 캐시·referrer 보호도 유지됐다. 배포된 랜딩의 메인/추천 브라우저 검사 7개를 다시 통과했고 페이지 JavaScript 오류는 없었다. 이미지 해시가 포함되는 배포 파일명도 검사하도록 회귀 검사를 보완했다. Google Form의 실제 전송은 가로챘으며 API·데이터베이스는 배포하거나 초기화하지 않았다.

원본 비교는 390/1440px에서 이미지 로딩과 슬라이드 시점을 맞춰 수행했다. 메인 Hero/WHY/HOW/TEAM의 샘플 화면에서 RGB 채널 차이 16을 넘는 픽셀 비율은 0.088–0.833%였다. 이는 해당 브라우저·화면·시점의 비교 결과이며 모든 환경의 픽셀 동일성을 의미하지 않는다.

배포 화면 비교에서 Lightning CSS가 뒤에 있던 WebKit 선언만 남기고 표준 `backdrop-filter`를 제거하는 문제를 발견했다. WebKit 선언을 먼저, 표준 선언을 마지막으로 배치해 압축 이후에도 원본의 흐림 효과를 유지했다. 수정 전 배포본에서 새 회귀 검사가 `none`으로 실패하는 것을 확인했고, 재배포 후 고정 메뉴·하단 CTA·알림 배지 모두 `blur(24px)`로 통과했다. 최종 27개 검색 제외 응답과 메인/추천 브라우저 검사도 재검증했다.
