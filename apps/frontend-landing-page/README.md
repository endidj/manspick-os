# @manspick/frontend-landing-page

[운영 맨즈픽](https://www.manspick.co.kr/)과 [원본 저장소](https://github.com/JeongWhale/manspick-site/tree/54f4a375b5c3babe9f9bb82ac423c4be6686fb60)를 React·TypeScript·Next App Router·Vinext/Vite·Cloudflare Workers로 포팅한 앱이다. 관리자·고객 앱과 같은 기술 스택을 사용한다.

## 화면과 책임

- `features/landing/source-{hero,proof,how,reviews,offer,chrome}.tsx`: 원본 마크업·문구·이미지 비율을 보존하는 서버 컴포넌트.
- `source-experience.tsx`, `source-runtime.ts`: React 수명에 연결한 스크롤·모달·폼·슬라이드 효과. 이벤트·타이머·관찰자를 해제하고 움직임 줄이기 설정을 지원한다.
- `source-radar.ts`: 원본 Chart.js 4.6.1의 곡선·툴팁·애니메이션. 원본에서 사용하던 라이브러리를 버전·MIT 라이선스와 함께 자체 호스팅한다.
- `features/package-quiz`: 원본 5단계 추천·7옵션·상담 견적. `marketing-offers.ts`에 원본 상담 상품을 분리한다. 관리자·고객 앱의 예약 상품이나 데이터를 변경하지 않는다.
- `/terms`, `/privacy`: 원본 정책 문서와 배치. 구형 `/legal`은 `/terms`로 이동한다.
- `features/seo`: canonical·OG·사업자/서비스 JSON-LD·운영 페이지 검색 허용. 구형 `.html` 주소는 query를 보존하며 308 이동한다.
- `/api/[...path]`: 기존 `@manspick/web/proxy`의 공개 API 권한 경계.

전체 HTML 삽입이나 원본 전역 스크립트 실행은 사용하지 않는다. 원본 CSS·정적으로 추출한 Tailwind utility는 `source.module.css` 안으로 범위를 제한한다. 공용 디자인 시스템의 폰트·SVG·타입·색상 토큰을 재사용하고 원본 전용 값은 `/styles/site-tokens.css`로 제공한다. 공용 UI의 기존 모양을 원본 화면에 강제하지 않는다.

사진 72개의 원본은 운영 사이트와 바이트 단위로 대조해 보존한다. 화면은 `@manspick/design-system/assets`의 `sourceImages`에 등록한 WebP 파생본과 `srcset`·`sizes`를 사용한다. EXIF·GPS·XMP·IPTC·ICC·주석은 파생본에서 제거하고 방향·투명도는 유지한다. [출처와 변환 방법](../../packages/design-system/src/assets/site/README.md)을 참고한다. CDN Tailwind·Iconify·폰트 요청은 필요하지 않다.

사진을 추가하거나 수정한 경우 루트에서 `yarn images:generate`를 실행하고 생성 결과를 함께 커밋한다. 소스·변환 설정·도구 버전·출력 해시가 같은 파일은 재사용하며, 일반 앱 빌드에서는 이미지를 변환하지 않는다. `yarn images:check`는 인코딩 없이 생성 결과와 메타데이터 제거 상태를 검사한다. 기존 Sharp 버전을 개발 의존성으로 고정했다.

첫 화면 아바타는 작은 썸네일을 사용하고, 갤러리는 열 때 이미지를 만든다. 화면에 가까워진 슬라이드만 다음 사진을 미리 디코딩한다. 폰트는 기존 WOFF2·한글 서브셋을 유지하며 공통 Pretendard 조각 하나, 메인·추천 화면의 Geist만 preload한다. 글자 범위나 서체를 바꾸지 않는다.

## 원본 동작과 명시적 차이

상담 견적은 원본의 ONE 85,000원·HYBRID 160,000원·ALL DAY 500,000원이다. 카카오 상담으로 연결되며 예약·결제로 자동 전달하지 않는다. 원본의 잔여석·열람자·최근 신청 표시는 시뮬레이션으로, 실제 예약 재고나 API에 쓰지 않는다.

원본의 깨진 `team-influencer-7.jpg` 참조를 실제 `7.JPG`로 고쳤다. 의류 관심 선택 시 수량 0으로 금액만 더하던 원본 계산 오류는 수량 1로 일관되게 처리한다. 원본에서 로드되지 않는 아이콘 3개의 빈 공간은 그대로 유지한다.

상담 폼은 개인정보 동의와 이름·전화번호 확인 후 원본 Google Forms에 native POST한다. 새 탭에서 접수 결과를 확인하도록 안내하며 접수 성공을 추정하지 않는다. GA/GTM 추적은 이식하지 않았다. 모달 포커스·Escape·스크롤 복구와 JavaScript 없는 본문 가독성을 보완했다.

## 검색 공개와 환경

2026-11-17 검색 공개 요청에 따라 **운영 랜딩·약관·개인정보 페이지는 검색 허용**이다. 추천·API·고객·어드민·Empty·Storybook은 검색 제외를 유지한다. Vite의 production 빌드와 대표 origin이 일치할 때만 공개 메타데이터와 사이트맵을 생성한다. 개발 서버·`--mode test` 빌드는 메타데이터가 noindex이고 사이트맵은 비어 있다. 내부 `MANSPICK_SITE_*` 빌드 상수를 사용하므로 외부 `NEXT_PUBLIC_SITE_INDEXABLE` 환경변수로 테스트 빌드의 색인을 켤 수 없다.

`NEXT_PUBLIC_SITE_ORIGIN`의 기본값과 검색을 허용하는 대표 주소는 `https://www.manspick.co.kr`이다. 다른 origin은 검색 제외다. 운영 빌드를 테스트 호스트에서 제공해도 HTTP `X-Robots-Tag`로 제외하며, 정적 자산은 `_headers`의 대표 호스트 예외로 구분한다. robots.txt는 추천 등의 noindex를 읽을 수 있도록 `Allow: /`를 유지한다. 운영 사이트맵에는 `/`, `/terms`, `/privacy`만 포함한다. 카피·사진·통계·연출은 변경하지 않았다. [검색 공개 정책과 남은 작업](../../docs/reference/27-landing-seo.md)

공유용 `og:url`과 OG·X·JSON-LD 이미지는 실제 빌드의 배포 주소를 사용한다. test 빌드는 기존 Vercel 사이트 대신 테스트 Worker의 `/images/og-smartstore-11725751378-wide.jpg`를 참조하며, canonical과 구조화 데이터의 식별자는 대표 도메인을 유지한다. 사용자가 지정한 스마트스토어 상품 이미지는 상단 인물 중심의 1200×630 가로형으로 제공한다. 얼굴은 온전히 보이게 하고 하단 `1% 비주얼…` 문구는 공유 이미지에서 제외한다. 정사각형 원본은 보관하며, 배포 검증에서는 태그의 절대 이미지 URL을 그대로 요청해 200·JPEG·1200×630을 확인한다. [이미지 출처](../../docs/reference/27-landing-seo.md#스마트스토어-og-이미지-교체--2026-11-17)

## 검증

루트에서 `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build`를 실행한다. 추천 단위 검사는 `yarn tsx --test apps/frontend-landing-page/src/features/package-quiz/recommendation.test.ts`다.

```powershell
$env:LANDING_APP_URL = 'http://127.0.0.1:3000'
node --test --test-concurrency=1 tests/landing.browser.test.mjs tests/landing-site.browser.test.mjs tests/landing-media.browser.test.mjs tests/landing-fonts.browser.test.mjs
```

브라우저 검사는 실제 제출을 가로채 외부 고객 정보를 보내지 않는다. 원본 대조·예외·배포 검증은 [마이그레이션 기록](../../docs/reference/23-landing-site-migration.md)에 기록한다. Vinext 개발 서버에서는 next.config의 응답 헤더가 생략되는 현상이 있으므로 검색 제외 HTTP 헤더는 배포용 빌드 프리뷰와 실제 배포에서도 검증한다.
