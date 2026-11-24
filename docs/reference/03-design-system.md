# 맨즈픽 디자인 시스템 · 공용 workspace

작성일: 2026-11-06 · 상태: 공용 패키지·원본 11종 컴포넌트·추가 13종 UI·Storybook 구현 및 세 앱 적용. 토큰·원본 SVG·브랜드 PNG47개와 앱용 WebP·자체 호스팅 폰트를 포함한다. 세 앱 브라우저 통합 검증은 진행 중이다. 사용법은 [패키지 README](../../packages/design-system/README.md)를 따른다.

## 1. 확정할 구조

사용자 요청에 따라 **`packages/design-system`을 단일 Yarn workspace**로 둔다. `apps/frontend-admin-page`, `apps/frontend-customer-page`, `apps/frontend-landing-page`이 공통 컴포넌트·컬러 토큰·아이콘·브랜드 애셋을 가져다 쓴다. 별도 tokens/ui/assets workspace로 쪼개지 않는다.

원본: [Figma Foundations](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=0-1), [Components](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=1-3), 같은 파일의 `98 Icons`, `99 Assets`, 고객·운영 화면. Foundations에는 manspick.kr Tailwind/style.css 기반, 다크, Pretendard/Geist, 파랑 강조색, 카드·버튼 radius 16 기준이 명시되어 있다.

아래 값은 **캔버스에 기재된 텍스트 값**이다. 네이티브 변수 컬렉션·alias·모드·모든 인스턴스의 style binding을 API로 추출한 결과는 아니다. 코드 토큰명·공개 경로·접근성 보완은 설계 제안이다.

## 2. 확인된 토큰

| 그룹       | 역할                           | 값                                |
| ---------- | ------------------------------ | --------------------------------- |
| Background | Base / Surface / Elevated      | `#0A0A0A` / `#141416` / `#1C1C1F` |
| Background | Glass / Accent tint            | white 3% / `#2D76F6` 12%          |
| Border     | Subtle / Strong / Accent       | white 8% / white 16% / `#2D76F6`  |
| Text       | Primary / Secondary / Tertiary | `#F5F5F5` / `#A1A1AA` / `#71717A` |
| Text       | On accent / Accent             | white / `#57C3FA`                 |
| Accent     | 500 / 600 / 300                | `#2D76F6` / `#1F5CD1` / `#57C3FA` |
| Status     | Success / Warning / Danger     | `#22C55E` / `#F59E0B` / `#EF4444` |
| Brand      | Kakao                          | `#FEE500`                         |

alpha 색은 배경 합성 후 대비를 검증한다. tertiary를 작은 필수 안내에 바로 적용하지 않는다. 상태는 색과 함께 문구·아이콘으로 표현한다. 원본의 Kakao 색은 채널·상담에 사용됐다. 주문 이후 카카오·구글 인증 동작은 [제품 요구사항](../01-product-requirements.md)을 따른다.

| Figma 스타일  | 글꼴       | 굵기     | 크기(px) |
| ------------- | ---------- | -------- | -------: |
| Display L     | Geist      | Bold     |       32 |
| H1            | Pretendard | Bold     |       24 |
| H2            | Pretendard | Bold     |       20 |
| H3            | Pretendard | SemiBold |       17 |
| Body L        | Pretendard | Regular  |       16 |
| Body M        | Pretendard | Regular  |       14 |
| Body M Strong | Pretendard | SemiBold |       14 |
| Label M       | Pretendard | SemiBold |       15 |
| Label S       | Pretendard | Medium   |       13 |
| Caption       | Pretendard | Regular  |       12 |
| Overline      | Geist      | SemiBold |       11 |

Pretendard v1.3.9·Geist v1.8.2의 공식 variable WOFF2와 OFL 원문을 패키지에 보관한다. Pretendard는 공식 dynamic subset 92개를 `unicode-range`로 선택 로딩하고, Geist는 기존 69,760바이트 파일을 사용한다. `font-display: swap`과 기존 폰트 이름·굵기 범위를 유지하며 외부 폰트 CDN·전역 preload를 사용하지 않는다. 전체 Pretendard 원본은 보존하지만 앱 CSS에서 참조하지 않는다. [파일·해시·라이선스·전송량 검사](../../packages/design-system/src/assets/fonts/README.md)를 기록했다. line-height·letter-spacing은 코드에서 보완한 값이며 Figma 변수 추출값으로 주장하지 않는다.

| 영역        | 확인 값                                                            |
| ----------- | ------------------------------------------------------------------ |
| Spacing     | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40px                              |
| Radius      | 8 / 12 / 16 / 24 / full                                            |
| 프레임 기준 | 고객·디렉터 Mobile 390, 운영 Desktop, 웹 Desktop 1440 / Mobile 390 |

390/1440은 원본 프레임 폭이며 유일한 지원 해상도나 확정 breakpoint가 아니다.

## 3. 토큰 계층

| 계층      | 책임                        | 제안 이름                                                        |
| --------- | --------------------------- | ---------------------------------------------------------------- |
| primitive | 원본 수치 보존              | `blue.500`, `space.4`, `radius.16`                               |
| semantic  | 화면 역할                   | `color.bg.surface`, `color.text.primary`, `color.action.primary` |
| component | 실제 반복되는 컴포넌트 차이 | `button.primary.bg`, `dateCell.selected.border`                  |

컴포넌트 CSS는 semantic custom properties를 사용한다. hex와 간격을 반복 복사하지 않는다. 원본이 다크이므로 다크를 기준으로 시작하고 라이트·다중 브랜드 모드는 추가하지 않는다. 랜딩과 운영의 밀도 차이는 layout·조합에서 다룬다.

각 토큰은 Figma 이름·노드·값·역할·검증 상태를 기록한다. 원본 변경과 코드 이름 변경을 구분하고 폐기·매핑 이력을 남긴다. 변수 자동 동기화와 Code Connect는 실제 패키지 구현 후 필요성을 확인해 결정한다.

## 4. 패키지와 공개 경로

현재 구현 구조다.

```text
packages/design-system/
  src/
    tokens/index.ts          원본 값·semantic mapping·타입
    components/
      button/index.ts        컴포넌트별 공개 API
      index.ts
    patterns/                입력·선택·요약·탭·모달/드로어·업로더
      index.ts
    icons/index.ts           이름 매핑·정적 SVG/컴포넌트
    assets/index.ts          공용 이미지 메타데이터·정적 참조
    styles/                  tokens/reset/base CSS
  .storybook/                Docs·접근성·Vitest/Chromium 설정
  README.md                  API·원본 대응·실행 안내
```

| 공개 경로 (`@manspick/design-system` 접두사) | 책임                                                 |
| -------------------------------------------- | ---------------------------------------------------- |
| `design-system/tokens`                       | 읽기 전용 토큰·타입                                  |
| `design-system/styles/tokens.css`            | 앱 루트에서 한 번 가져오는 CSS 변수                  |
| `design-system/styles`                       | 토큰·폰트·reset/base 전체를 앱 루트에서 한 번 가져옴 |
| `design-system/styles/fonts.css`             | 자체 호스팅 폰트 선언                                |
| `design-system/components`, `components/*`   | 원본 11종과 PriceCard·Accordion                      |
| `design-system/patterns`, `patterns/*`       | 입력·선택·요약·탭·모달·업로더                        |
| `design-system/icons`                        | 타입 안전한 Icon·53개 원본 이름·호환 이름            |
| `design-system/assets`                       | 이미지 manifest·정적 파일 참조                       |

폴더별 `index.ts`는 공개 모듈 경계에 둔다. 전체 UI·사진·아이콘을 루트의 `export *`로 모으거나 상위 index에 `use client`를 붙이지 않는다. hooks를 쓰는 개별 모듈만 client 경계를 선언한다. 이벤트 handler 전달은 사용하는 앱의 client 경계가 담당한다. 정적 파일·CSS 폴더마다 의미 없는 index.ts를 만들지 않는다.

디자인 시스템은 DB·인증·결제·예약 상태 전이에 의존하지 않는다. PhotoTile의 선택 표시와 선택 가능한 장수·추가금·인가를 구분한다. 완성 업무 화면은 각 앱 feature가 조합한다. **고객 사진·설문·보정본은 공용 assets에 넣지 않는다.**

## 5. 공통 컴포넌트

Components 페이지에서 확인한 아래 11종을 모두 구현했다. 로그인된 브라우저 속성 패널로 크기·간격·색상과 표시 상태를 확인했다. 모든 인스턴스의 binding을 자동 추출한 것은 아니며 로딩·실패·키보드 동작 등은 구현 보완이다.

| 원본          | Node   | 명세할 역할·상태                                         |
| ------------- | ------ | -------------------------------------------------------- |
| Button        | 3:10   | 주요/보조, disabled/loading/focus, icon-only 접근 이름   |
| TimeSlot      | 3:17   | 가능/선택/예약/불가/만료, 서버 경합 오류                 |
| DateCell      | 3:30   | 오늘/선택/휴무/마감, 키보드 이동                         |
| CheckItem     | 3:47   | 준비·촬영 체크, 필수/완료/오류                           |
| PhotoTile     | 3:60   | 후보·셀렉·수정 의견, 진행/부분 실패/재시도/비공개        |
| StepHeader    | 3:79   | 고객 7단계·설문 4페이지 진행                             |
| AppBar        | 4:2    | 제목·뒤로·보조 행동·모바일 안전 영역                     |
| StageBadge    | 51:47  | 단계·상태 문구, 고객에게 내부30상태 그대로 노출하지 않음 |
| TemplateBlock | 51:80  | 변수·복사·발송 처리, 복사와 실제 전송 구분               |
| KanbanCard    | 51:96  | 고객·패키지·상태·일정·담당·다음 행동                     |
| NavItem       | 51:134 | Default/Active, 현재 위치·접근 이름                      |

추가 구현: TextField, TextArea, RadioPills, ChoiceCard, SectionHeader, SummaryCard, InfoRow, StickyActionBar, Tabs, Dialog(모달/드로어), UploadDropzone, PriceCard, Accordion. `01 Customer Screens`(1:2), `03 Website — Landing`(12:2), `04 Website — Recommend`(12:3), `06 Internal`(56:2)에서 반복되는 표현을 추출했다. 기존 Brand·Badge·Panel·Field·EmptyState·Notice·Loading·Steps는 앱 호환용으로 유지한다.

PhotoTile은 4:5, Button 기본 높이는 56px이며 sm/md/lg를 지원한다. 네이티브 입력 속성과 controlled 값/콜백, 아이콘·이미지·액션 slot으로 조합한다. DateCell은 날짜 선택 버튼이며 달력 전체의 키보드 이동·휴무/마감 정책을 구현했다고 해석하지 않는다. UploadDropzone은 파일 선택/drop만 담당하며 실제 업로드 큐·진행·재시도는 소비자가 PhotoTile 상태와 조합한다.

접근성 보완: 원본 blue500(#2D76F6)은 그대로 보존한다. 흰 15px 버튼 글자는 이 배경에서 대비 약 4.17:1이므로 component 배경을 blue600(#1F5CD1)으로 매핑했다. 선택된 날짜·시간·사진 순번도 같은 원칙을 적용하고 작은 파란 상태 글자는 blue300으로 표시한다. 원본 수치를 몰래 변경한 것으로 기록하지 않는다.

StageBadge 원본의 2=설문·3=일정은 최신 업무 순서와 다르다. `label`을 필수로 받아 업무 상태에서 명시적으로 매핑하도록 했다. UI의 source preset을 업무 규칙으로 사용하지 않는다. 랜딩의 구 가격·무제한 수정 문구를 PriceCard에 하드코딩하지 않는다.

패키지 선택·합산 달력·설문·촬영 설계·보정 작업·지금 할 일은 앱 feature로 둔다. 공통 표현만 디자인 시스템으로 이동한다.

## 6. 애셋과 아이콘

`99 Assets`(12:4)의 이미지 레이어 **47개를 로그인된 브라우저의 네이티브 PNG 3x export로 수입했다.** 이전38개 목록에 styling 2~9·12를 더한 실제 수량이다. 원본 화면을 통째로 이미지화한 것이 아니라 개별 브랜드 사진을 가져와 앱 UI 안에 배치한다.

| 분류      | 확인 이름                                                   |
| --------- | ----------------------------------------------------------- |
| 변신 사례 | `hero-before-1`~`6`, `hero-after-1`~`6`                     |
| 보정 사례 | `retouch-before-1`~`3`, `retouch-after-1`~`3`               |
| 장소      | `location-1`~`3`                                            |
| 소품      | `props-1`~`8`                                               |
| 스타일링  | `styling-1`~`12`                                            |
| 팀        | `team-influencer-3`, `team-influencer-5`                    |
| 기타      | `peace`, `grooming-guide`, `cross-check-1`, `cross-check-2` |

PNG 원본 47개는 모두 540×720px·총 22,612,477바이트이고 원본 바이트를 보존한다. 앱용 WebP 47개는 크기·크롭을 유지한 quality88 압축본·총 2,300,354바이트다. [출처와 보관 방식](../../packages/design-system/src/assets/brand/README.md), [파일별 크기·SHA-256·출처 manifest](../../packages/design-system/src/assets/brand/figma-export-manifest.json)를 기록했다. `@manspick/design-system/assets`의 `brandImages`와 `BrandImageName`으로 URL·치수를 가져오며 Storybook `Foundations/Brand images`에서 47개 로딩을 확인한다. 이 목록을 전체 Figma 파일의 모든 참조 이미지가 존재한다는 보증으로 확장하지 않는다.

`98 Icons`(14:2)의 **53개 SVG**를 브라우저에서 직접 export했다. Solar 51개·Kakao 1개·Instagram 1개, 총50,484바이트이며 모두 24×24 viewBox다. ZIP의 원본 바이트와 SHA-256이 전부 일치한다. [manifest](../../packages/design-system/src/assets/icons/figma-export-manifest.json)와 [출처](../../packages/design-system/src/assets/icons/README.md)를 보관한다. 원본 이름 53개와 기존 코드의 별칭20개를 제공하며, 원본에 없는 clock/search/settings/logout/plus는 별도 호환 파일5개다.

Icon은 원본 SVG URL을 CSS mask로 써서 `size/currentColor`를 지원한다. 장식용은 aria-hidden, label이 있으면 접근 가능한 이미지로 제공한다. Next에서는 정적 미디어 URL로 변환된다. 동적 이름 API의 URL manifest가 번들에 들어가므로 모든 아이콘이 개별 tree shaking된다고 주장하지 않는다. SVG는 표시되는 mask에서 요청되고 Vite는 작은 파일을 inline할 수 있다. 컬렉션별 원문·상표 사용 조건은 자산 README에 연결한다.

애셋 manifest 필드: ID, Figma node URL, 용도, 파일명, format, width/height, 비율, alt/장식 여부, 저작·초상권 사용 근거, 버전/hash. 비포·애프터는 인물과 순서를 쌍으로 유지한다. 미확인 촬영물 사용 동의를 자동 승인 처리하지 않는다.

현재 SVG 53개는 원본 보존을 위해 수정하지 않고 mask 이미지로 표시한다. 랜딩은 공용 WebP를 Next.js Image의 width/height/sizes와 함께 표시한다. 현재 각 자산은 단일 크기이고 `unoptimized`로 제공하므로 여러 해상도의 responsive source나 배포 이미지 변환까지 완료했다고 주장하지 않는다. 비공개 고객 사진은 별도 인가와 캐시 정책을 따르며 공용 브랜드 자산에 넣지 않는다. 프로젝트에 제공된 원본의 보관은 인물·상표의 외부 재배포 권한을 뜻하지 않는다.

## 7. CSS·번들 최적화

CSS Modules + CSS custom properties를 기본 설계로 채택한다. Foundations의 Tailwind 설명은 원본 유래다. 현재 저장소에 Tailwind가 설치된 것으로 간주하지 않는다.

전역은 토큰·reset·기본 타이포로 제한한다. 컴포넌트 CSS는 사용 경로에서 가져오고 랜딩 효과가 운영 앱에 포함되지 않게 한다. CSS export와 sideEffects를 명시해 tree shaking 과정에서 스타일이 누락되지 않도록 검증한다.

서버 표시 UI에 업로더·상태 관리 의존성을 연결하지 않는다. 상호작용은 작은 클라이언트 경계로 분리한다. 각 앱 production build에서 JS/CSS·폰트·이미지 전송량과 중복을 측정한다. index.ts 자체가 최적화를 보장하지 않는다.

## 8. 검증·변경 절차

| 검증   | 기준                                                                 |
| ------ | -------------------------------------------------------------------- |
| 추적   | 토큰·컴포넌트·사용 화면과 Figma node가 연결됨                        |
| 상태   | 해당 UI의 기본/hover/focus/pressed/disabled/loading/error/empty 명세 |
| 접근성 | 키보드·보이는 focus·label·오류 연결·대비·비색상 상태                 |
| 반응형 | 390 및 더 작은 모바일·데스크톱·긴 한글·확대에서 행동이 가려지지 않음 |
| 사진   | 40~50장 다중 업로드 진행·부분 실패·재시도·순서·공개 전환 표현        |
| 경계   | 서버/클라이언트·비밀 재수출 금지, 내부 src 우회 import 금지          |
| 시각   | 버튼·달력·업로드·고객 홈·운영 보드 대표 상태를 원본과 비교           |
| 배포   | 공용 변경의 세 앱 build·주요 화면 영향 확인                          |

원본 확인 → 명세 → 대표 화면 조합 → 세 앱 영향 확인 순서로 변경한다. Storybook의 Overview, Foundations, Components, Patterns, Icons에서 토큰·상태·공개 props를 볼 수 있다. Chromium play 검사는 controlled 선택·입력·복사 실패·탭·모달/드로어 Escape 및 포커스 복귀·파일 선택을 확인하고 addon-a11y는 위반을 실패로 처리한다. 자동 검사 통과는 모든 브라우저·수동 접근성·전체 화면의 픽셀 일치 보증이 아니다. 실행 명령과 최신 검증 범위는 패키지 README에 기록한다.

고객 앱은 AppBar·StepHeader·DateCell/TimeSlot·CheckItem·PhotoTile과 입력/탭/업로더를, 운영 앱은 NavItem·KanbanCard·StageBadge·TemplateBlock과 입력/탭/모달을, 랜딩은 PriceCard·Accordion·SectionHeader·ChoiceCard와 브랜드 자산을 조합한다. 인증·업로드 요청·상태 전이는 앱과 서버가 맡는다. [고객 앱](../../apps/frontend-customer-page/README.md) · [운영 앱](../../apps/frontend-admin-page/README.md) · [랜딩](../../apps/frontend-landing-page/README.md) · [Figma 대응과 검증](13-figma-parity.md)

[PRD](../01-product-requirements.md) · [권한](02-accounts-and-permissions.md) · [Cloudflare 아키텍처](../07-cloudflare-architecture.md) · [출처](00-sources-and-traceability.md)
