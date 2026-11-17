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
- 새 의존성·가시적인 카피·사진·연출 변경 없음. 원격 배포·검색엔진 계정 작업 없음.

## 남은 운영 작업

- 운영 배포와 `www.manspick.co.kr` 라우팅 연결. 배포 전 환경변수에 예전 `manspick.kr`가 남아 있지 않은지 확인한다. 현재 기존 사이트는 이 저장소의 로컬 변경만으로 갱신되지 않는다.
- 배포 후 최종 HTML/HTTP 검색 지시, canonical·OG 이미지·사이트맵, www 이동, 추천·고객·어드민 제외를 실제 주소에서 재확인한다.
- Google Search Console·네이버 서치어드바이저 소유 확인 및 최종 사이트맵 제출, URL 검사. 소유 확인 태그가 있다는 사실만으로 계정 등록 완료를 뜻하지 않는다.
- 모바일 실제 Core Web Vitals(LCP·INP·CLS), 색인/노출/클릭·상담 전환을 운영 트래픽으로 측정한다.
- 서비스별 콘텐츠·사례·가이드, 실제 사업 정보에 맞는 지도 프로필과 외부 링크는 별도 콘텐츠 작업이다. 이번 요청에 따라 원문은 수정하지 않았다.
- `남자 프로필사진`, `소개팅사진`, `남자 이미지컨설팅` 등의 실제 검색어·지역별 검색 의도와 유입을 확인해 콘텐츠별 목표 키워드와 내부 링크를 설계한다. 검색량·현재 순위는 이번 코드 검증으로 확인되지 않는다.
- 별도 전화번호·정확한 좌표·후기 원문 등 확인되지 않은 정보를 추가하지 않았다.

검색 공개는 색인·순위·리치 결과를 보장하지 않는다. 과거 문서의 전 앱 noindex와 Lighthouse SEO 69는 당시 정책의 검증 기록이며 현재 정책은 이 문서를 따른다.
