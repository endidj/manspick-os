# 랜딩 정적 생성과 코드 분할

## 렌더링 방식

Next App Router/React와 기존 Vinext/Vite/Cloudflare 구성을 유지한다. Vinext는 기본적으로 요청 시 렌더링하므로 `prerender`와 설치된 `staticAssetsAdapter`를 명시적으로 연결했다. 새로운 의존성은 없다.

| 경로                | 방식           | 이유                                                                 |
| ------------------- | -------------- | -------------------------------------------------------------------- |
| `/`                 | SSG            | 서버 데이터에 의존하지 않는 고정 랜딩                                |
| `/terms`            | SSG            | 고정 이용약관                                                        |
| `/privacy`          | SSG            | 고정 개인정보처리방침                                                |
| `/legal`            | 정적 308       | `/terms`로 이동하는 고정 응답                                        |
| 404 화면            | 정적 생성      | 기본 찾을 수 없음 화면                                               |
| `/recommend`        | SSR 유지       | `?pkg=one`, `hybrid`, `allday`에 따라 최초 HTML의 선택 상품이 달라짐 |
| `/api/*`            | 동적 서버 처리 | 기존 API 프록시 및 접근 제어 유지                                    |
| `/*.html` 이전 주소 | 동적 308       | 요청의 쿼리를 새 주소에 보존                                         |

고객·관리자 앱은 이번 랜딩 전환 범위에 포함하지 않았다. `robots.txt`와 빈 sitemap의 기존 검색 제외 정책도 유지한다. 이 두 메타데이터 경로는 이번 프리렌더 산출물의 페이지 목록에 포함되지 않는다.

정적 본문을 바꾸면 다시 빌드·배포한다. 메인·약관·개인정보 페이지의 `dynamic = 'error'`는 요청별 API가 추가됐을 때 빌드에서 발견하게 한다. 추천 페이지는 정적 HTML 하나로 모든 쿼리를 대체하거나 브라우저에서 뒤늦게 선택을 바꾸지 않는다.

빌드는 HTML/RSC를 `dist/server/prerendered-routes`에 생성하고, 어댑터가 배포 ASSETS의 내부 캐시에 복사한다. 기존 `runWorkerFirst`의 `/*` 규칙을 유지해 `/_vinext/static-cache/*`는 외부에서 404로 처리한다. 실제 페이지 요청만 Worker를 통해 사전 생성된 응답을 받는다.

## 코드 분할과 재사용

- 메인 본문·메타데이터는 초기 HTML에 남고, 애니메이션·메뉴 등 첫 화면 동작은 기존 runtime에서 시작한다.
- 상담 모달·폼은 첫 클릭에 로드한다. 팀 갤러리를 열면 사진 데이터 모듈도 로드한다.
- 이미지 슬라이드는 화면 400px 안으로 접근할 때 사진 데이터 모듈을 준비한다. 기존 Chart.js 화면 근접 로딩도 유지한다.
- 공유 수명 관리 코드는 기존 이벤트·타이머 해제를 추출했다. 지연 중 Escape·다른 클릭·페이지 이탈은 이전 요청을 취소하며, 다운로드 실패는 재시도 안내를 제공한다.
- 디자인 시스템의 자산·토큰 API를 그대로 사용한다. 사진 원본, 반응형 WebP, 메타데이터 제거, lazy loading, 폰트 파일은 변경하지 않았다.
- 약관·개인정보·추천 화면의 홈 링크는 자동 prefetch를 끈다. 메인 SSG 전환으로 다른 화면에서도 큰 메인 RSC와 Geist 폰트를 미리 받던 현상을 네트워크에서 확인하고 차단했다. 클릭 시 페이지 이동은 그대로 동작한다.

메인 인터랙션 청크의 빌드 크기 비교이며 전체 React 런타임의 크기는 아니다.

| 청크                                |                  전환 전 |  전환 후 | gzip 전환 후 |
| ----------------------------------- | -----------------------: | -------: | -----------: |
| 최초 인터랙션                       | 51,055 B (gzip 15,433 B) | 18,823 B |      7,843 B |
| 필요 시 모달·폼                     |         최초 청크에 포함 |  3,109 B |      1,560 B |
| 필요 시 사진 데이터·갤러리·슬라이드 |         최초 청크에 포함 | 30,806 B |      7,058 B |

최초 인터랙션 청크의 gzip 크기는 약 49% 감소했다. 초기 요청에 지연 모듈이 없는지, 상담만 열었을 때 사진 모듈은 받지 않는지도 브라우저에서 확인한다. 코드 분할은 초기 HTML에 이미 들어 있는 검색 본문을 제거하지 않는다.

## Lighthouse SEO 100 대 69

2026-11-17 한국 시간, Lighthouse 13.6.0 / Chromium 156 / 동일 모바일 설정으로 두 주소를 검사했다.

- 원본 `https://www.manspick.co.kr/`: **100**
- 이식본 `https://manspick-landing-test.winningant8.workers.dev/`: **69**
- 유일한 실패: `is-crawlable`. HTML의 robots 메타 태그와 `X-Robots-Tag` 응답 헤더 모두 사용자가 요청한 `noindex, nofollow, noarchive, noimageindex`를 포함한다.
- 나머지 9개 점수 반영 SEO 항목은 모두 통과했다. 런타임 오류·검사 경고는 없었다.

이 버전은 `is-crawlable`에 `93/23`의 가중치를 부여한다. 다른 9개 항목이 모두 통과하면 `100 × 9 / (9 + 93/23) = 69`다. SSG나 React 자체의 감점이 아니다. 검색 공개를 별도로 요청하기 전에는 점수를 위해 차단을 해제하지 않는다. Lighthouse SEO는 검색 순위나 모든 SEO 품질을 보장하는 검사가 아니다.

검사 원본은 로컬 `.local/lighthouse-seo/{original,migrated}.report.{json,html}`와 `comparison.json`에 있다. [Lighthouse 13.6.0 가중치](https://github.com/GoogleChrome/lighthouse/blob/v13.6.0/core/config/default-config.js), [Vinext 캐시 문서](https://github.com/cloudflare/vinext/blob/main/docs/caching.mdx)를 참고한다.

## 검증

- 변경 전 배포의 기존 브라우저 검사 9개 통과.
- 정적 응답 검사는 빌드 산출물과 실제 HTML/RSC 바이트의 일치, 캐시 HIT, noindex, 3가지 추천 쿼리의 서버 선택, 이전 주소 쿼리 보존, 비공개 캐시 404, API 접근 제어를 확인한다.
- 기존 폰트·반응형 사진·애니메이션·갤러리·상담·추천 검사와 새 지연 로딩 검사를 배포용 Worker 프리뷰에서 수행한다.
- 전체 타입·ESLint·단위 검사와 변경 파일 포맷을 확인한다. 이미지 재인코딩은 일반 빌드에 추가하지 않았다.

로컬 검증에서 전체 타입·ESLint·단위 140개가 통과했다. 기존 브라우저 검사 9개, 새 지연 로딩 검사 1개, 정적 응답 검사 1개를 확인했고, 폰트 프리페치 수정 뒤 관련 8개 검사도 다시 통과했다.

## 최종 배포 확인 — 2026-11-17

- 구현 공개 커밋: `abbeb4ee081669124e5d53b0f6194b81c9f12491` (`endidj/manspick-os`, main).
- 랜딩 Worker 버전: `0e930a3d-e303-48e4-9b85-84debcc25ecd`.
- 주소: `https://manspick-landing-test.winningant8.workers.dev/`.
- 공개 저장소에서 새로 만든 배포용 빌드의 브라우저·SSG 검사 11개 통과. 배포 후 실제 URL에서도 동일한 11개 통과.
- SSG 3개 페이지의 HTML/RSC 응답은 배포에 사용한 빌드 파일과 바이트 단위로 일치하며 `X-Vinext-Cache: HIT`를 반환한다. 추천의 3가지 쿼리는 SSR 선택 상태·no-store를 유지한다.
- 초기 모바일 사진 요청 290,812 B, 화면별 폰트 요청·크기 유지. 사진 메타데이터 제거 상태는 기존 이미지 회귀 검사에서 확인했다.
- landing/customer/admin/empty/storybook의 27개 응답에서 검색 제외 유지 확인. 다른 앱·API·DB는 배포하거나 변경하지 않았다.
- 최종 Lighthouse SEO 69: `is-crawlable`만 실패, 신규 실패·실행 경고·오류 없음. 결과는 `.local/lighthouse-seo/post-deploy.report.{json,html}`와 `post-deploy-summary.json`에 보존했다.
- 배포 산출물에는 정적 HTML/RSC만 추가되며 일반 빌드에서 이미지 재인코딩은 하지 않는다.
