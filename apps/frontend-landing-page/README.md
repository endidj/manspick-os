# @manspick/frontend-landing-page

[운영 맨즈픽](https://www.manspick.co.kr/)과 [원본 저장소](https://github.com/JeongWhale/manspick-site/tree/54f4a375b5c3babe9f9bb82ac423c4be6686fb60)를 React·TypeScript·Next App Router·Vinext/Vite·Cloudflare Workers로 포팅한 앱이다. 관리자·고객 앱과 같은 기술 스택을 사용한다.

## 화면과 책임

- `features/landing/source-{hero,proof,how,reviews,offer,chrome}.tsx`: 원본 마크업·문구·이미지 비율을 보존하는 서버 컴포넌트.
- `source-experience.tsx`, `source-runtime.ts`: React 수명에 연결한 스크롤·모달·폼·슬라이드 효과. 이벤트·타이머·관찰자를 해제하고 움직임 줄이기 설정을 지원한다.
- `source-radar.ts`: 원본 Chart.js 4.6.1의 곡선·툴팁·애니메이션. 원본에서 사용하던 라이브러리를 버전·MIT 라이선스와 함께 자체 호스팅한다.
- `features/package-quiz`: 원본 5단계 추천·7옵션·상담 견적. `marketing-offers.ts`에 원본 상담 상품을 분리한다. 관리자·고객 앱의 예약 상품이나 데이터를 변경하지 않는다.
- `/terms`, `/privacy`: 원본 정책 문서와 배치. 구형 `/legal`은 `/terms`로 이동한다.
- `features/seo`: canonical·OG·JSON-LD·강제 noindex. 구형 `.html` 주소는 query를 보존하며 308 이동한다.
- `/api/[...path]`: 기존 `@manspick/web/proxy`의 공개 API 권한 경계.

전체 HTML 삽입이나 원본 전역 스크립트 실행은 사용하지 않는다. 원본 CSS·정적으로 추출한 Tailwind utility는 `source.module.css` 안으로 범위를 제한한다. 공용 디자인 시스템의 폰트·SVG·타입·색상 토큰을 재사용하고 원본 전용 값은 `/styles/site-tokens.css`로 제공한다. 공용 UI의 기존 모양을 원본 화면에 강제하지 않는다.

사진 72개는 운영 사이트와 바이트 단위로 대조한 원본이다. `@manspick/design-system/assets`의 `sourceImageUrls`와 [출처 기록](../../packages/design-system/src/assets/site/README.md)을 사용한다. CDN Tailwind·Iconify·폰트 요청은 필요하지 않으며 npm 의존성을 추가하지 않았다.

## 원본 동작과 명시적 차이

상담 견적은 원본의 ONE 85,000원·HYBRID 160,000원·ALL DAY 500,000원이다. 카카오 상담으로 연결되며 예약·결제로 자동 전달하지 않는다. 원본의 잔여석·열람자·최근 신청 표시는 시뮬레이션으로, 실제 예약 재고나 API에 쓰지 않는다.

원본의 깨진 `team-influencer-7.jpg` 참조를 실제 `7.JPG`로 고쳤다. 의류 관심 선택 시 수량 0으로 금액만 더하던 원본 계산 오류는 수량 1로 일관되게 처리한다. 원본에서 로드되지 않는 아이콘 3개의 빈 공간은 그대로 유지한다.

상담 폼은 개인정보 동의와 이름·전화번호 확인 후 원본 Google Forms에 native POST한다. 새 탭에서 접수 결과를 확인하도록 안내하며 접수 성공을 추정하지 않는다. GA/GTM 추적은 이식하지 않았다. 모달 포커스·Escape·스크롤 복구와 JavaScript 없는 본문 가독성을 보완했다.

## 검색 제외와 환경

사용자가 공개를 다시 요청하기 전까지 **모든 앱·모든 환경에서 검색 제외**다. `NEXT_PUBLIC_SITE_INDEXABLE=true`도 색인을 켜지 못한다. HTML meta와 HTTP `X-Robots-Tag`에 `noindex, nofollow, noarchive, noimageindex`를 넣는다. robots.txt는 `Allow: /`로 noindex 지시를 읽게 하며 sitemap은 비어 있다. 정적 파일은 `_headers`로 보호한다. Storybook manager·preview·정적 파일도 포함한다.

`NEXT_PUBLIC_SITE_ORIGIN`은 canonical·공유 주소를 정하며 기본값은 원본 canonical인 `https://manspick.kr`이다. 이 값은 검색 허용 스위치가 아니다.

## 검증

루트에서 `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build`를 실행한다. 추천 단위 검사는 `yarn tsx --test apps/frontend-landing-page/src/features/package-quiz/recommendation.test.ts`다.

```powershell
$env:LANDING_APP_URL = 'http://127.0.0.1:3000'
node --test tests/landing.browser.test.mjs tests/landing-site.browser.test.mjs
```

브라우저 검사는 실제 제출을 가로채 외부 고객 정보를 보내지 않는다. 원본 대조·예외·배포 검증은 [마이그레이션 기록](../../docs/reference/23-landing-site-migration.md)에 기록한다. Vinext 개발 서버에서는 next.config의 응답 헤더가 생략되는 현상이 있으므로 검색 제외 HTTP 헤더는 배포용 빌드 프리뷰와 실제 배포에서도 검증한다.
