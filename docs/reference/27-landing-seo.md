# 랜딩 검색 공개 — 2026-11-17

## 범위와 구현 계획

사용자가 랜딩 검색 공개를 허용했다. 기존 카피·이미지·통계·좌석/최근 신청/열람자 연출은 유지한다. 추천·고객·어드민의 검색 제외와 인증·파일 보호도 유지한다.

1. 접근 가능한 대표 주소 `https://www.manspick.co.kr`로 canonical·공유 메타데이터·JSON-LD·사이트맵을 통일한다.
2. production 빌드의 공개 페이지만 index를 허용하고 개발/테스트 빌드와 다른 호스트는 검색 제외를 유지한다.
3. 사이트맵에는 index 가능한 정상 페이지만 넣고 robots.txt에 운영 사이트맵을 알린다.
4. 기존 상담 상품 데이터를 재사용해 서비스·가격 구조화 데이터를 보강한다.
5. 공개/비공개 경계·정적 생성·기존 화면 동작을 회귀 검사한다.

## 정책

| 대상                        | production 빌드 + 대표 호스트   | 개발/테스트 빌드 또는 다른 호스트 |
| --------------------------- | ------------------------------- | --------------------------------- |
| `/`, `/terms`, `/privacy`   | index, follow; 이미지 검색 허용 | noindex                           |
| `/recommend`, `/api/*`      | noindex                         | noindex                           |
| 공개 사진·OG·아이콘         | HTTP noindex 없음               | HTTP noindex                      |
| sitemap.xml                 | 공개 페이지 3개                 | 테스트 빌드는 빈 사이트맵         |
| 고객·어드민·Empty·Storybook | 기존 검색 제외 유지             | 기존 검색 제외 유지               |

생성된 production HTML을 다른 호스트로 제공해도 HTTP 검색 제외가 우선한다. `robots.txt`는 noindex를 읽을 수 있도록 수집을 허용한다. `manspick.co.kr` 요청은 대표 www 주소로 영구 이동하며 기존 `.html` 이동과 쿼리 보존을 유지한다. 도메인/DNS/원격 라우트 설정은 이번 로컬 변경에 포함하지 않는다.

정적 자산의 `_headers` 예외는 빌드 모드와 무관하게 실제 대표 호스트에만 적용된다. 테스트 빌드를 운영 호스트에 연결하지 않는다. HTML은 이 경우에도 빌드 시 생성된 noindex로 검색 제외된다.

`NEXT_PUBLIC_SITE_ORIGIN`은 기존 설정 경로를 사용한다. 대표 주소가 아닌 값은 검색 제외한다. Vite에서 `command === 'build' && mode === 'production'`와 대표 origin을 검사하고 내부 `MANSPICK_SITE_*` 상수로 전달한다. Vinext가 자동 수집하는 `NEXT_PUBLIC_SITE_INDEXABLE=true` 값으로 테스트 빌드의 검색 정책을 덮어쓰지 못한다.

대표 호스트 이동은 `src/proxy.ts`에서 처리한다. 현재 Vinext의 외부 URL config redirect는 쿼리를 제거하므로 원본 URL의 protocol·host만 변경해 상품·유입 쿼리를 보존한다.

## 재사용

- 기존 `pageMetadata`, `resolveSiteSettings`, JSON-LD 직렬화, 구형 주소 리다이렉트를 수정한다.
- `marketingPackages`의 실제 ONE/HYBRID/ALL DAY 가격을 구조화 데이터에 재사용한다.
- 디자인 시스템 이미지·폰트·토큰과 공통 API 프록시는 그대로 사용한다. 새 의존성은 없다.
- 구조화 데이터는 기존 화면의 매일 11:00–21:00 및 서울·경기 촬영 지역을 반영한다. 자체 별점·시뮬레이션 잔여석을 검색용 평점/재고로 제공하지 않는다.

## 검증 방법

기본 검사는 `yarn typecheck`, `yarn lint`, `yarn test`, 변경 파일 포맷 검사와 랜딩 production/test 빌드다. 실제 Worker 프리뷰에서 `LANDING_APP_URL`과 `LANDING_BUILD_ROOT`를 지정해 SEO·구조화 데이터·SSG·기존 화면 검사를 실행한다. production 빌드는 `LANDING_INDEXABLE=true`, test 빌드는 false로 지정한다. localhost 자체는 HTTP noindex를 유지하며 운영 Host 요청을 별도로 검사한다.

로컬 운영 Host 검사 시 preview 실행 환경에 `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.manspick.co.kr`를 지정한다. 테스트의 native HTTP 요청은 원격 도메인 대신 `LANDING_APP_URL`에 연결하며 Host만 전달한다. Node 24의 fetch는 Host를 덮어쓰므로 이 검사에 사용하지 않는다.

## 검증 결과

- 전체 typecheck·ESLint 및 변경 파일 포맷 검사 통과, 단위 테스트 145개 통과.
- 랜딩 production/test 빌드 통과. 홈·약관·개인정보의 사전 생성 HTML/RSC 원본 일치와 캐시 HIT를 확인했다.
- production HTTP·브라우저 검사 13개 통과. 대표 주소·검색 지시·사이트맵·이미지·구조화 데이터·도메인 이동·추천 동작과 320–1440px 화면을 확인했다.
- `NEXT_PUBLIC_SITE_INDEXABLE=true`를 주입한 test 빌드의 경계 검사 6개 통과. 공개 페이지도 noindex이며 사이트맵은 비어 있다.
- 최종 로컬 운영 Host 조건의 Lighthouse SEO 100/100, 실패 항목·실행 경고 없음. 운영 사이트 점수나 실제 검색 순위에 대한 측정은 아니다.
- 새 의존성·가시적인 카피·사진·연출 변경 없음. 초기 검증에서는 원격 배포·검색엔진 계정 작업을 하지 않았다. 이후 승인된 테스트 배포는 아래에 기록한다.

## 남은 운영 작업

- 새 Cloudflare 사이트의 운영 배포와 `www.manspick.co.kr` 라우팅 연결은 남아 있다. 기존 Vercel의 잘못된 도메인 메타데이터는 아래 운영 hotfix로 수정했지만, 이 저장소의 변경이 자동으로 기존 Vercel에 배포되는 구조는 아니다.
- 배포 후 최종 HTML/HTTP 검색 지시, canonical·OG 이미지·사이트맵, www 이동, 추천·고객·어드민 제외를 실제 주소에서 재확인한다.
- Google Search Console·네이버 서치어드바이저 소유 확인 및 최종 사이트맵 제출, URL 검사. 소유 확인 태그가 있다는 사실만으로 계정 등록 완료를 뜻하지 않는다.
- 모바일 실제 Core Web Vitals(LCP·INP·CLS), 색인/노출/클릭·상담 전환을 운영 트래픽으로 측정한다.
- 서비스별 콘텐츠·사례·가이드, 실제 사업 정보에 맞는 지도 프로필과 외부 링크는 별도 콘텐츠 작업이다. 이번 요청에 따라 원문은 수정하지 않았다.
- `남자 프로필사진`, `소개팅사진`, `남자 이미지컨설팅` 등의 실제 검색어·지역별 검색 의도와 유입을 확인해 콘텐츠별 목표 키워드와 내부 링크를 설계한다. 검색량·현재 순위는 이번 코드 검증으로 확인되지 않는다.
- 별도 전화번호·정확한 좌표·후기 원문 등 확인되지 않은 정보를 추가하지 않았다.

검색 공개는 색인·순위·리치 결과를 보장하지 않는다. 과거 문서의 전 앱 noindex와 Lighthouse SEO 69는 당시 정책의 검증 기록이며 현재 정책은 이 문서를 따른다.

## 승인된 테스트 배포 — 2026-11-17

사용자가 커밋·푸시·배포를 요청했으며, 추가 확인에서 운영 도메인은 변경하지 않도록 지정했다. 이번 배포는 기존 `manspick-landing-test`만 갱신했다.

- 공개 구현 커밋: `397dfbb98c6142104ad693add253946a6125e59d` (`endidj/manspick-os`, main).
- Worker 버전: `7e43daa5-95da-4977-bcd8-4e708d3e73cd`.
- 주소: `https://manspick-landing-test.winningant8.workers.dev/`.
- 공개 릴리스 작업트리의 typecheck·ESLint·포맷·단위 145개, test 빌드·HTTP 회귀 6개 및 Wrangler dry-run을 통과한 뒤 동일 산출물을 배포했다.
- 실제 배포의 HTML/RSC가 빌드 파일과 일치하고 캐시 HIT를 반환한다. 구조화 데이터·대표 주소·OG 이미지 200, 추천 검색 제외·비공개 캐시 404도 확인했다.
- 배포 후 HTTP·구조화 데이터 검사 2개와 실제 Chromium 화면·추천 검사 7개가 통과했다. 상담 제출은 테스트에서 가로채 실제 전송하지 않았다.
- 테스트 주소는 noindex·빈 사이트맵을 유지한다. `www.manspick.co.kr`은 여전히 기존 Vercel 사이트이며 새 운영 SEO 정책은 이 도메인에 반영되지 않았다.
- 고객·어드민·API·DB·DNS·Vercel 설정은 변경하지 않았다. 새 OG 이미지는 아직 생성하지 않았다.

## 운영 도메인 이전 방법 — 실행하지 않음

Vercel 프로젝트 접근 권한과 도메인 등록기관/DNS 변경 권한은 별개다. 도메인의 DNS와 네임서버를 관리할 수 있으면 기존 Vercel 계정을 인수하기 전에도 새 호스팅으로 전환할 수 있다. 이 권한이 현재 소유자에게 있으면 소유자의 협조가 필요하다. [Vercel DNS 관리](https://vercel.com/docs/domains/managing-dns-records)

1. 등록기관·DNS 관리자·Vercel 프로젝트 소유자를 확인하고 현재 DNS 전체와 기존 프로젝트의 소스·환경 설정을 확보한다.
2. 운영용 API 연결과 검색 공개 설정을 가진 Worker를 먼저 검증한다. 현재 테스트 API를 그대로 운영에 연결하지 않는다.
3. DNS가 Cloudflare에 없으면 기존 웹·메일 MX/SPF/DKIM/DMARC·검증 TXT·하위 도메인 레코드를 복제하고 네임서버를 이전한다. DNSSEC 사용 시 기존 DS 처리를 포함한 공식 절차를 따른다. 도메인 등록기관 자체를 바꿀 필요는 없다. [Cloudflare DNS 이전](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/)
4. 활성 Cloudflare zone에서 `www.manspick.co.kr`을 운영 Worker의 Custom Domain으로 연결한다. 같은 이름의 기존 CNAME은 전환 시 정리하고, 루트 도메인은 www로 이동하도록 연결한다. Cloudflare가 DNS와 인증서를 관리한다. [Workers Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
5. HTTPS·화면·상담·canonical·robots·사이트맵·OG를 확인한 뒤 기존 Vercel 연결을 정리한다. 그 전에는 기존 프로젝트와 DNS 값을 보관해 연결을 되돌릴 수 있게 한다.

현재 실제 DNS 관리 계정의 권한과 전체 레코드는 확인하지 않았다. 도메인·네임서버·인증서·Vercel 프로젝트 변경은 수행하지 않았다.

## OG 미리보기 URL 보완 — 2026-11-17

사용자가 OpenGraph.xyz에서 이미지가 보이지 않는 현상을 제보했다. 기존 사진 콜라주 파일은 테스트 Worker에 있지만 메타태그의 `https://www.manspick.co.kr/images/og-image.jpg`는 기존 Vercel 사이트에서 404를 반환했다. 이전 검사는 메타태그의 경로를 테스트 호스트로 바꿔 요청해 이 오류를 놓쳤다.

- 기존 1200×630 JPEG 이미지를 재사용한다. 사진·문구를 새로 만들거나 변경하지 않는다.
- canonical·사이트맵·JSON-LD 식별자는 운영 대표 주소를 유지하고, `og:url`과 OG·X·JSON-LD 이미지는 실제 배포 주소로 만든다. test 빌드는 `manspick-landing-test.winningant8.workers.dev`를 사용한다.
- 실제 배포 검사는 `og:image`와 `twitter:image`의 절대 URL을 변경 없이 요청한다. 이전 배포에서 404 실패를 재현했고 새 배포에서는 200·JPEG·1200×630 검사를 통과했다.
- 운영 도메인·DNS·기존 Vercel 사이트와 검색 제외 경계는 변경하지 않는다.

공개 수정 커밋은 `8b672e30652d28e7b30898464e62f91668a09708`, 테스트 Worker 버전은 `f074ab7a-cd49-4cb6-9ee8-07b33b4e5333`이다. 타입·lint·format·SEO 단위 7개, 운영 빌드 로컬 HTTP 5개, 테스트 빌드 로컬 HTTP 6개와 배포 후 HTTP 5개 검사가 통과했다. 원격에서는 이미 로컬에서 검증한 Host 시뮬레이션 2개만 건너뛰었다. OpenGraph.xyz의 같은 URL을 Rescan해 사진 표시와 오류 0개·통과 11개를 확인했다. 경고 2개는 이미지 내 홍보 문구와 description 길이 제안이며 사용자 요청에 따라 문구는 유지했다.

## 스마트스토어 OG 이미지 교체 — 2026-11-17

사용자가 기존 사진 콜라주 대신 [맨즈픽 스마트스토어 상품](https://smartstore.naver.com/_manspick/products/11725751378)의 OG 이미지를 지정했다. 해당 페이지의 `og:image`와 `twitter:image`가 가리키는 [원본 이미지](https://shop-phinf.pstatic.net/20260516_128/17788596303106JvD8_PNG/41847861411907666_2084221316.png?type=o1000)를 그대로 저장했다. 원본은 인물과 문구가 합성된 1000×1000 상품 홍보 이미지이며 새로 생성하거나 편집하지 않았다.

- 저장 위치: `apps/frontend-landing-page/public/images/og-smartstore-11725751378.jpg`
- 원본 URL은 `.png`이지만 실제 응답 형식은 JPEG이며 파일 바이트를 변환하지 않았다.
- SHA-256: `70c85b5dbffc1c3783b8f025e839da24d4cf8d0965e6ad94af5eb099cc96a56b`
- 새 파일명으로 OG·X·JSON-LD·사이트맵을 연결해 이전 공유 이미지 캐시와 구분하고, 기존 `og-image.jpg`는 배포 자산에서 제거한다.
- 원본 비율과 모든 문구를 유지한다. 플랫폼별 큰 카드에서 정사각형 이미지 일부가 잘릴 수 있다.

공개 수정 커밋은 `07e5fc8`, 테스트 Worker 버전은 `b08c12b5-8810-4f47-b66c-b1a35070e661`이다. 타입·lint·format·SEO 단위 7개·테스트 빌드·로컬 HTTP/브라우저 7개를 통과했다. 배포 직후에는 이전 HTML이 잠시 반환됐지만 전파 후 HTTP 5개와 원본 SHA-256 일치·이전 이미지 URL의 404를 확인했다. OpenGraph.xyz에서 새 이미지 로딩을 확인했으며, 원본의 1:1 비율로 인해 가로 카드에서 잘림과 비율 오류 1개가 남는다. 문구 관련 제안 경고는 2개이며 원본과 사이트 문구는 변경하지 않았다.

## OG 상단 크롭 보완 — 2026-11-17

사용자가 얼굴 잘림과 하단 `1% 비주얼…` 문구 노출을 지적해 원본 상단을 가로형으로 잘랐다. 정사각형 원본의 `(x=0, y=0, width=1000, height=525)` 영역을 기존 Sharp로 1200×630으로 비례 확대하고 JPEG 품질 95·4:4:4로 저장했다. 인물·사진·원래 그래픽을 다시 그리지 않고 픽셀 크롭만 적용했으며 하단 배너는 범위 밖으로 제외했다. imagegen 편집 시안은 원본을 다시 그리는 변화가 있어 채택하지 않았다.

결과는 `apps/frontend-landing-page/public/images/og-smartstore-11725751378-wide.jpg`다. 정사각형 원본은 보관하고 OG·X·JSON-LD·사이트맵은 새 파일을 사용한다. 메타데이터와 실제 이미지 검사도 1200×630으로 맞췄다. 사이트 본문·카피·운영 도메인은 변경하지 않는다.

공개 수정 커밋 `4c1e5da`, 테스트 Worker 버전 `309af326-8afb-440f-ac5d-45d123024572`로 배포했다. 타입·lint·format·SEO 단위 7개·빌드·로컬 HTTP 6개·원격 HTTP 5개를 통과했으며, 배포 파일 SHA-256은 `0244dc417f63f236fcc5d478eaafbd166877212c4ed08930110a1f3a6bb07882`로 검수 파일과 같다. OpenGraph.xyz에서 두 얼굴 전체 노출·하단 배너 제외·1200×630 로딩을 확인했고 비율 오류는 해소됐다(오류 0·경고 2·통과 11). 경고는 CTA와 description 길이에 대한 기존 문구 제안이다.

## 기존 Vercel 운영 hotfix와 SEO·GEO 보완 — 2026-11-17

사용자가 운영 오류 해결·배포와 나머지 코드 개선을 요청했고, Vercel 계정을 아직 받지 못했으므로 도메인은 유지하도록 확인했다. 조사 결과 새 수정본은 Cloudflare 테스트 Worker에만 배포되어 있었고 운영 주소는 별도 Vercel 프로젝트를 가리켰다. 새 사이트의 SSG 캐시 문제가 아니었다.

### 기존 운영 사이트에 실제 반영한 내용

연결된 GitHub 계정에 `JeongWhale/manspick-site` 쓰기 권한과 Vercel 자동 배포 연결이 있어, 해당 저장소의 최소 변경으로 운영 문제를 해결했다.

- [운영 수정 커밋 b269ce2](https://github.com/JeongWhale/manspick-site/commit/b269ce2): canonical·OG·JSON-LD·robots·사이트맵 주소를 `www.manspick.co.kr`로 수정했다.
- 사이트맵에서 실제 noindex인 추천·약관·개인정보 주소를 제외하고 홈의 실제 수정일을 기록했다. 새 Cloudflare 사이트와 기존 Vercel의 법적 페이지 색인 정책은 다르다.
- 존재하지 않던 OG 파일 대신 사용자 승인 1200×630 이미지 원본을 추가하고 잘못된 네이버 인증 placeholder 중복 태그를 제거했다.
- 기존 HTML의 body 이후 내용은 줄바꿈 정규화 비교에서 변경되지 않았다. 도메인·DNS·보이는 카피·가격·통계·연출·GA 설정은 유지했다.
- Vercel 자동 배포 성공 후 실제 운영 canonical, robots, XML URL, OG 200·SHA-256 일치와 비공개 페이지 noindex를 확인했다.

### 새 Cloudflare 코드와 테스트 배포에 반영한 내용

- FAQ 11개를 JavaScript 없이 native details로 열 수 있도록 기본 HTML을 보완했다. JS가 실행되면 기존 더보기 동작을 유지하고 ARIA 상태를 제공한다. 문구는 그대로다.
- 공용 디자인 시스템의 기존 촬영 이미지 3개를 운영용 이미지 사이트맵에 추가했다. 홈 lastmod는 실제 변경일이며 빌드마다 갱신하지 않는다.
- 실제 이미지를 확인한 뒤 촬영 사례 3개의 alt를 장면 설명으로 보완했다.
- JSON-LD에 홈페이지와 웹사이트·사업자·서비스 간 연결, 사용자가 지정한 스마트스토어의 공식 채널, 화면에 있던 네이버 지도 링크를 추가했다.
- 상품 포함 항목은 기존 `marketingIncludes`를 재사용했다. 연락처·좌표·후기·평점·성과 수치를 새로 만들지 않았다.
- 기존 공개 HTML·robots 수집 허용을 유지했다. 별도 AI API, llms.txt, 자동 백링크 생성, 학습 허용 정책 변경은 추가하지 않았다.

테스트 Worker 버전은 `3c00c2b0-ce8e-432e-863d-be1cc9be39d4`다. 기존 테스트 API binding을 유지하고 DB·다른 Worker·운영 도메인은 변경하지 않았다. 테스트 주소는 계속 noindex·빈 사이트맵이다.

### 검증과 남은 항목

- 랜딩 타입 검사·관련 ESLint·포맷·SEO 단위 7개 통과. production/test SSG 빌드 및 Wrangler dry-run 통과.
- 운영 빌드 로컬 HTTP·브라우저 8개 통과(원격 OG 검사는 로컬에서 제외), 테스트 빌드 HTTP·구조화 데이터 6개 통과.
- 내부 앵커 33개와 주요 페이지 링크, Googlebot·Yeti·bingbot·OAI-SearchBot User-Agent의 초기 HTML 200을 로컬에서 확인했다. 실제 검색엔진 IP의 크롤링이나 색인을 증명하는 검사는 아니다.
- 원격 Cloudflare HTTP·구조화 데이터 5개와 JS 없는 FAQ 11개 브라우저 검사 통과. 운영 Host 시뮬레이션 2개는 이미 로컬에서 검사해 원격에서는 제외했다.
- 기존 화면·갤러리·모바일 메뉴·상담 폼 회귀 검사 통과. 상담 제출은 가로채 실제 전송하지 않았다.
- 화면·구조화 데이터·보관된 기존 운영 HTML의 업체명, 주소, 영업시간, 이메일, 가격은 의미상 일치한다. 지도·스마트스토어의 현재 외부 등록 정보까지 검증한 것은 아니다.
- ONE 가격표의 1시간 30분과 FAQ의 약 1시간은 기존 원본에도 있는 차이이며 문구 보존 요청에 따라 수정하지 않았다.
- 새 사이트의 운영 도메인 이전, 검색 도구 계정 등록·제출·AI 포함 설정 확인, 실제 사용자 성능·검색/AI 유입·전환 측정, 추가 서비스·가이드 콘텐츠와 외부 소개 확보는 남아 있다.
