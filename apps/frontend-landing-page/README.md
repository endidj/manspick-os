# 맨즈픽 랜딩 앱

서비스 소개, 촬영 패키지 추천, 상담을 제공하는 공개 사이트입니다. 루트에서 `yarn dev`를 실행하고 [localhost:3000](http://localhost:3000)을 엽니다. 화면 문구·사진·연출의 기준은 [원본 사이트 소스](https://github.com/JeongWhale/manspick-site/tree/0f62aa2ee68722b19c0b7547c6dfb7501cdbdd10)입니다.

## 화면과 데이터

| 경로                 | 제공 방식과 담당 코드                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | 빌드 시 HTML과 RSC를 생성합니다. [landing](src/features/landing/)에 섹션, 갤러리, 상담 폼과 방문 지표 수집이 있습니다.                               |
| `/recommend`         | 요청 시 렌더링합니다. `?pkg=one`, `hybrid`, `allday`를 첫 화면에 반영합니다. [package-quiz](src/features/package-quiz/)에 추천·견적 계산이 있습니다. |
| `/terms`, `/privacy` | 빌드 시 생성하는 약관·개인정보처리방침입니다. 이전 `.html` 주소는 쿼리를 보존해 새 주소로 이동합니다.                                                |
| `/api/*`             | `@manspick/web/proxy`를 통해 공통 서버에 요청합니다.                                                                                                 |

추천 견적은 [상담용 상품](src/features/package-quiz/marketing-offers.ts)을 사용하고 카카오 상담으로 연결합니다. 실제 주문과 희망 일정은 고객 앱에서 접수합니다. 상담 폼은 동의와 연락처를 확인한 뒤 기존 Google 양식으로 제출합니다. 잔여석·열람자 표시는 시뮬레이션 값입니다.

## 검색과 캐시

운영 빌드는 `https://www.manspick.co.kr`, 테스트 빌드는 `https://manspick-landing-test.winningant8.workers.dev`를 기본 주소로 사용합니다. 두 주소의 홈·약관·개인정보 페이지가 검색과 사이트맵에 포함됩니다. 추천·API와 로컬 개발 주소는 검색에서 제외합니다. 대표 주소, OG, 구조화 데이터의 기준은 [SEO 설정](src/features/seo/settings.ts)과 [빌드 설정](vite.config.ts)에서 확인할 수 있습니다.

공개 페이지를 수정하면 다시 빌드합니다. 브라우저는 HTML을 재검증하고, Worker는 배포 버전에 해당하는 사전 생성 파일을 사용합니다. 해시가 붙은 정적 자산만 장기 캐시하며 내부 `/_vinext/static-cache/*` 파일은 직접 제공하지 않습니다.

고객사에 공유할 검색 최적화 설명은 [SEO·GEO 개선 보고서(PDF)](../../output/pdf/맨즈픽_SEO_GEO_개선_보고서.pdf)에 있습니다.

## 사진·아이콘·라이선스

- 랜딩 사진은 디자인 시스템의 `sourceImages`에서 가져옵니다. 사진을 교체할 때는 원본 목록과 크기별 WebP를 함께 갱신합니다. [자산 출처와 갱신](../../packages/design-system/README.md#자산-출처와-갱신)
- 공유 이미지는 스마트스토어 상품 사진 상단을 1200×630으로 자른 JPEG입니다. 원본과 [배포 이미지](public/images/og-smartstore-11725751378-wide.jpg)를 함께 보관합니다. [원본 상품](https://smartstore.naver.com/_manspick/products/11725751378)
- 파비콘 원본을 교체하면 `node scripts/generate-site-icons.mjs`로 생성하고 `--check`로 확인합니다. [아이콘 생성 설정과 해시](src/features/seo/icons/manifest.json)
- 레이더 차트는 Chart.js 4.6.1을 자체 호스팅합니다. 배포 파일의 SHA-256은 `87364cc2b2a76a6684929e7d6b80b18a897794db38400caff1fcf1791c6925d2`입니다. [원본 배포 파일](https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js) · [MIT 라이선스](public/vendor/chartjs/LICENSE.md)

## 검증

랜딩 앱을 실행한 뒤 저장소 루트에서 브라우저 검사를 실행합니다. 상담 제출은 테스트가 가로챕니다.

```powershell
$env:LANDING_APP_URL = 'http://127.0.0.1:3000'
node --test --test-concurrency=1 tests/landing.browser.test.mjs tests/landing-site.browser.test.mjs tests/landing-media.browser.test.mjs tests/landing-fonts.browser.test.mjs
```

SSG와 검색 헤더는 빌드 프리뷰에서 확인합니다. [정적 페이지 검사](../../tests/landing-static.browser.test.mjs)는 `LANDING_BUILD_ROOT`에 빌드한 앱 디렉터리, `LANDING_APP_URL`에 해당 프리뷰 주소를 지정합니다. 검색 허용 빌드는 `LANDING_INDEXABLE=true`를 사용합니다.
