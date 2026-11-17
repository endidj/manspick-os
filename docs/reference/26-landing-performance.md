# 랜딩 추가 성능 최적화와 캐시

## 변경 내용

기존 React/Next App Router/Vinext와 Cloudflare 배포 구성을 유지한다. 디자인 시스템의 자산·폰트·아이콘·토큰을 재사용하며, 사진의 화질과 화면에 보이는 애니메이션을 일괄 낮추지 않는다.

- favicon의 원본 256px ICO(270,398B)를 보존하고 16/32/48px PNG 프레임 ICO(6,721B)를 생성했다. 별도 180px Apple 아이콘과 256px PNG도 제공한다. 일반 Chromium 탭은 DPR 1/2에서 작은 ICO만 받는 것을 확인했다.
- 랜딩 고정 문구에 필요한 가변 폰트를 원본에서 추출했다. 본문 136,896B와 표시용 24,552B이며, 원본의 윤곽·글자 폭·가변 축을 검증하고 OFL에 따라 파생본 이름을 구분했다. 새 한글은 원본 unicode 폰트 조각으로 폴백한다. Chart.js도 현재 화면의 폰트 설정을 재사용한다.
- 팀 갤러리 `sizes`를 실제 3열 너비에 맞췄다. 1440px DPR2에서 선택하는 사진 합계가 1,323,048B에서 459,150B로 약 65.3% 감소했다. 이미 카드에서 받은 큰 사진은 브라우저가 재사용할 수 있다. 390px DPR2는 기존 459,150B를 유지한다.
- 공용 안내·본문 바로가기 스타일을 `essentials.css`에 모으고 랜딩은 업무 앱 레이아웃 CSS를 가져오지 않는다. 약관·개인정보는 홈 전체 스타일 대신 실제 사용하는 규칙만 가져온다.
- 공용 Icon의 반복 고정 스타일을 CSS Module로 옮겨 HTML/RSC를 줄였다. 크기·색·접근성·사용자 style 우선순위는 유지한다.
- 화면 밖 섹션에 `content-visibility: auto`를 적용한다. 본문은 SSG HTML에 그대로 있으며, 화면에 접근할 때 레이아웃과 페인트를 수행한다. 앵커를 선택하면 `:has(:target)`으로 전체 높이를 확정해 기존 smooth scroll의 목적지를 보존한다. 팀 모달은 같은 기능 scope 안에서 섹션 밖으로 옮겨 viewport 위치를 유지한다. 인쇄는 전체 본문을 렌더한다.

이미지·아이콘·폰트 생성은 일반 앱 빌드에 연결하지 않는다. 변경된 원본이나 글리프 집합이 있을 때 명시적으로 생성하고 결과를 커밋한다. Node의 `--check` 검사는 재인코딩 없이 현재 상태를 검증한다. 도구와 원본 정보는 [사진 최적화](24-media-optimization.md), [폰트 README](../../packages/design-system/src/assets/fonts/landing/README.md), [아이콘 README](../../apps/frontend-landing-page/src/features/seo/icons/README.md)를 참고한다.

## 캐시가 있어도 새 배포를 받는 구조

| 대상                                    | 브라우저·외부 HTTP 캐시               | Cloudflare에서의 재사용과 갱신                                                                                                       |
| --------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 해시 주소의 이미지·폰트·아이콘·CSS·JS   | `public, max-age=31536000, immutable` | Static Assets로 제공. 파일 내용 변경 시 빌드가 새 해시 URL을 만들어 새 HTML/CSS에서 참조한다.                                        |
| `/`, `/terms`, `/privacy` HTML/RSC      | `public, max-age=0, must-revalidate`  | `staticAssetsAdapter`가 빌드 ID·경로·응답 종류별 사전 생성 파일을 ASSETS에서 읽는다. 새 Worker 배포는 새 manifest와 파일을 사용한다. |
| `/favicon.ico` 등 고정 public 자산 경로 | 재검증                                | 새 배포의 ASSETS manifest에 해당하는 파일을 사용한다.                                                                                |
| `/recommend`와 API                      | 기존 `no-store`                       | 요청별 처리와 접근 제어 유지. 공용 장기 캐시를 추가하지 않는다.                                                                      |

SSG의 `X-Vinext-Cache: HIT`는 사전 생성 응답을 재사용한다는 뜻이며 Worker 실행을 완전히 건너뛴다는 의미는 아니다. 브라우저에 보내는 HTML을 1년 동안 고정하지 않아도 Cloudflare 내부의 버전별 정적 자산 캐시를 사용할 수 있다. 배포 시 모든 자산을 purge할 필요가 없고, 변경 없는 파일의 캐시도 유지할 수 있다. Cloudflare가 모든 지역에서 파일을 반드시 1년 보관한다고 보장하는 것은 아니다.

예를 들어 `photo.ABC.webp`를 받았던 사용자는 사진 수정 배포 후 HTML이 가리키는 `photo.DEF.webp`를 받는다. 이전 파일의 캐시가 새 파일을 덮어쓰지 않는다. 이미 열려 있는 탭은 자동으로 새 화면으로 바뀌지 않으며 새로고침·새 방문에서 최신 배포를 확인한다.

근거: [Cloudflare Static Assets](https://developers.cloudflare.com/workers/static-assets/), [ASSETS binding](https://developers.cloudflare.com/workers/static-assets/binding/), [Vinext static assets response cache](https://github.com/cloudflare/vinext/blob/main/docs/caching.mdx#static-assets-response-cache), [content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility).

## 검증 범위

변경 전 배포를 기준으로 390px·1440px에서 홈·약관·개인정보·추천의 주요 좌표와 서체 크기·굵기·색을 비교한다. 모달의 viewport 위치, 앵커 진입, 축소 모션, 인쇄, 갤러리 선택량, 폰트 preload·희귀 한글 폴백을 검사한다. 원본 사진 메타데이터 제거와 검색 제외도 유지한다.

Lighthouse 모바일 성능은 변경 전 두 번에 40/62로 호스트 부하에 따른 편차가 컸다. 단일 점수로 고정된 성능 개선을 보장하지 않는다. React 런타임의 코드 커버리지나 이미지 압축 추정치만 보고 필수 코드를 제거하거나 사진 품질을 낮추지 않았다. 측정 원본은 로컬 `.local/performance-audit/`에 보존한다.

## 배포 측정 — 2026-11-17

최적화 구현 공개 커밋은 `531a014`, 최초 앵커 회귀 보완은 `7bf1768`이다. 아래 수치는 Worker `9971b5a6-b31e-40eb-8de3-0d210f51e120`을 같은 Chromium 조건에서 읽은 결과다. KB는 1,000B 기준이며 raw와 전송 크기를 구분한다.

| 항목                                   |         변경 전 |      최적화 후 |
| -------------------------------------- | --------------: | -------------: |
| favicon 파일                           |        270,398B |         6,721B |
| 홈 초기 폰트                           | 18개 / 517,012B | 2개 / 161,448B |
| 모바일 초기 사진                       |        290,812B |        74,110B |
| 모바일 초기 전체 이미지 전송(SVG 포함) |        305,143B |        80,949B |
| 데스크톱 DPR2 갤러리 선택 사진         |      1,323,048B |       459,150B |
| 홈 HTML raw                            |        708,488B |       584,963B |
| 홈 HTML 전송                           |         59,683B |        58,546B |
| 약관 CSS raw                           |        146,493B |        83,285B |
| 약관 CSS 전송                          |         32,035B |        22,773B |

압축 전 HTML은 약 17.4% 줄었지만 실제 전송 절감은 약 1.9%다. 초기 전체 JavaScript는 이번 변경에서 사실상 같은 크기이며, 기존 지연 로딩 경계를 유지한다. 홈 CSS 전송도 31,927B에서 31,823B로 거의 같다. CSS 절감은 약관·개인정보 화면에서 크다.

Lighthouse 13.6.0 모바일 두 번은 변경 전 성능 40/62, 이후 76/62였다. LCP는 전 4.0/2.3초에서 후 1.9/1.4초, 메인 스레드 작업은 전 27.8/13.1초에서 후 6.6/12.2초였다. TBT는 후에도 0.68/6.61초로 변동이 크므로 점수나 CPU 시간의 고정 개선율은 주장하지 않는다. 실행 경고·런타임 오류는 없었다.

- 전체 타입 7개 프로젝트, ESLint, 변경 파일 Prettier, 단위 143개 통과.
- 공통 UI Storybook 25파일·79개 interaction/접근성 검사 통과.
- 실제 배포 주소의 브라우저 검사 14개 통과. 390/1440 주요 좌표·폰트·갤러리·상담·추천·최초 smooth 앵커·인쇄·SSG HTML/RSC 일치를 확인했다.
- 5개 웹 앱 27개 응답에서 검색 제외를 유지한다. 다른 앱·API·DB는 배포하지 않았다.
- 변경 전 브라우저 캐시를 유지한 첫 전환에서 최신 HTML build ID와 6,721B favicon을 확인했다. 해당 실행은 폰트 20개를 관측해 엄격한 2개 요청 검사에는 실패했고 최종 요청 목록을 보존하지 못했으므로 이전 폰트의 추가 전송 여부는 확정하지 못했다. 현재 버전 재방문은 폰트 2개, `transferSize: 0`으로 별도 확인했다.

위치는 [배포 랜딩](https://manspick-landing-test.winningant8.workers.dev/)이며, 원본 측정·화면·회귀 로그는 `.local/performance-audit/`에 있다. 실제 Safari/iOS 기기의 렌더·캐시는 이번 검증에 포함하지 않았다.

## 모바일 메뉴 정렬 보완

사용자가 확인한 원형 버튼 안의 햄버거 아이콘은 배포 화면에서 중심보다 3px 위에 있었다. 36px 버튼 안의 20px 아이콘을 감싼 `text-xl`의 28px line box와 inline baseline이 원인이며, SVG의 세 줄은 원래 중앙 대칭이다. 해당 wrapper에 기존 `flex items-center justify-center`만 적용해 아이콘을 가운데 정렬한다. 공용 Icon과 원본 SVG는 수정하지 않는다.

최종 코드 커밋은 `f4c7af4`, Worker 버전은 `d0b18f39-f346-425a-befb-3600ccea0938`이다. 실제 배포의 390/768px DPR2에서 메뉴 열림·닫힘 네 경우 모두 중심 오차 x=0px, y=0px을 확인했다. 측정과 화면은 `.local/performance-audit/menu-alignment-deployed*`에 있다.

헤더 변경 후 공개 프리뷰와 실제 배포 양쪽에서 기존 사이트 상호작용·SSG/캐시 검사 2개를 다시 통과했다. 메뉴 정렬 한 줄 외에 앱 동작은 추가 변경하지 않았다.

새 캐시 정책을 적용한 버전에서 이 후속 배포로 넘어갈 때 같은 브라우저 캐시를 유지했다. HTML build ID가 `7df1771449162791897c8cdb2d34fb37`에서 `7c74ab5c6fbcad366c9ecd4179f801a9`로 바뀌고 고정 favicon은 최신 6,721B를 반환했다. 변경 없는 사진 8개와 폰트 2개는 `transferSize: 0`으로 재사용했다. 전체 캐시 purge 없이 최신 HTML과 기존 자산 재사용이 함께 동작한 검증이며, 결과는 `.local/performance-audit/cache-header-deploy.json`이다. 이 후속 배포에서는 앞선 전환의 폰트 20개 현상이 재현되지 않았다.
