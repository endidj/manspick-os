# @manspick/design-system

고객·운영·랜딩 앱이 공유하는 React 컴포넌트, 스타일과 자산을 제공한다. 화면을 추가할 때 아래 공개 경로와 Storybook에서 기존 UI의 상태와 조합을 먼저 확인한다.

| 공개 경로 (`@manspick/design-system/` 하위)                                  | 용도                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [components](src/components/index.ts)                                        | Button, DateCell, PhotoTile, StageBadge 등 개별 UI와 props             |
| [patterns](src/patterns/index.ts)                                            | 라벨·오류가 연결된 입력, 탭, 모달·드로어, 업로더 등 반복되는 화면 구성 |
| [tokens](src/tokens/index.ts)                                                | 원본 값, 용도별 색상, 컴포넌트별 값, 타이포그래피                      |
| [icons](src/icons/index.ts) · [assets](src/assets/index.ts)                  | 아이콘 이름과 컴포넌트, 브랜드·랜딩 사진, 로컬 폰트 URL                |
| [styles](src/styles/base.css) · [styles/landing.css](src/styles/landing.css) | 앱 루트에서 한 번 불러오는 공통 스타일과 랜딩용 스타일 진입점          |

`components/button`, `patterns/text-field`와 같은 개별 공개 경로도 사용할 수 있다. 인터랙션에 필요한 클라이언트 경계는 개별 모듈에 둔다. Next.js에서 이벤트 핸들러를 넘길 때는 호출하는 컴포넌트에 클라이언트 경계를 둔다. [패키지 공개 경로](package.json)

## 화면 기준

색상·서체·간격을 한눈에 비교할 때는 [Figma 토큰 미리보기](../../docs/sources/figma-design-tokens-preview.png)를 사용한다.

- 고객과 운영 화면은 다크 배경과 파란 강조색, 4px 단위 간격을 사용한다. 고객 화면은 작은 기기부터 데스크톱까지 대응하고 운영 목록은 한눈에 볼 수 있도록 조밀하게 배치한다. 색·글자·간격을 바꿀 때는 기존 semantic·typography 토큰을 먼저 확인한다. [Figma Foundations](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=0-1) · [공통 CSS 변수](src/styles/tokens.css)
- Figma에서 공용 컴포넌트는 Components, 고객 여정은 Customer Screens, 운영 화면은 Internal을 기준으로 비교한다. [Components](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=1-3) · [Customer Screens](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=1-2) · [Internal](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=56-2)
- 상태는 문구로도 표시한다. 키보드 포커스·로딩·오류·빈 상태를 확인하고 움직임을 줄이는 사용자 설정을 따른다. 기본 버튼과 일부 선택 상태의 원본 파랑(`#2D76F6`)과 흰 글자 대비는 약 4.17:1이다. Storybook은 `data-contrast-exception="figma-blue500"`를 지정한 요소에서만 해당 대비 검사를 제외한다. [접근성 검사 설정](.storybook/preview.ts)

## 컴포넌트 사용 시 주의점

- `Button`의 기본 타입은 `button`이다. 폼 제출에는 `type="submit"`, 아이콘만 있는 버튼에는 접근 가능한 이름을 준다. `Icon`은 기본적으로 장식용이며 정보를 전달할 때는 `label`을 준다.
- `DateCell`은 날짜 한 칸을 표시한다. 달력 탐색과 예약 가능 여부는 앱에서 처리한다. `PhotoTile`에는 컷 번호가 포함된 이름과 선택 가능 여부를 넘긴다. `UploadDropzone`은 선택하거나 드롭한 파일을 앱에 전달한다. 접근 권한·장수 제한·서버 검증·재시도는 앱과 서버가 처리한다.
- `StageBadge`의 `label`은 실제 업무 단계에서 매핑한다. `PriceCard`는 현재 상품의 가격을 받고, `TemplateBlock`의 복사와 수동 발송 완료 표시는 앱이 별도로 처리한다.

## Storybook

저장소 루트에서 실행한다. 개발 주소는 `http://127.0.0.1:6006`이며 Storybook만 띄울 때는 API나 로컬 DB가 필요하지 않다.

```sh
yarn storybook
yarn storybook:browser  # 처음 한 번 테스트용 Chromium 설치
yarn storybook:test     # Chromium 상호작용과 axe 접근성 검사
yarn storybook:build    # 정적 결과물은 .local/storybook-static
```

컴포넌트 옆의 `*.stories.tsx`에 주요 상태를 추가하고, 키보드·선택·닫기 같은 상호작용은 `play`에서 검사한다. 반복 실행은 `yarn storybook:watch`, 설정·예제 타입 검사는 `yarn workspace @manspick/design-system typecheck:storybook`을 사용한다.

## 자산 출처와 갱신

앱은 `@manspick/design-system/assets`에서 사진과 폰트 URL을 가져온다. 아래 명령은 저장소 루트에서 실행한다.

### 사진

- **브랜드 사진**은 Figma에서 PNG로 내보내 보관하고 `brandImages[name]`으로 WebP와 치수를 제공한다. 프로젝트에 제공된 사진만 여기에 둔다. 고객 업로드·설문·보정본은 인가된 파일 저장소에서 관리한다. [Figma 99 Assets](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=12-4) · [원본과 WebP 해시](src/assets/brand/figma-export-manifest.json)
- **랜딩 사진**은 `sourceImages[name]`의 `src`, `srcSet`, 치수와 표시 폭에 맞는 `sizes`를 사용한다. 작은 사진에는 `thumbnailSrc`를 쓴다. 교체 시 원본과 목록의 크기·SHA-256을 갱신하고 `yarn images:generate`, `yarn images:check`를 실행한다. 방향·투명도는 보존하고 EXIF·GPS를 제거한 WebP, manifest, `src/assets/site/source-images.ts`를 함께 반영한다. [원본 저장소](https://github.com/JeongWhale/manspick-site/tree/54f4a375b5c3babe9f9bb82ac423c4be6686fb60) · [원본 목록](src/assets/site/originals/manifest.json) · [웹용 사본 목록](src/assets/site/generated/manifest.json)

### 아이콘

원본 SVG는 Figma에서 내보냈다. `src/assets/icons/`의 `compat/`, `customer/`, `site/`에는 각각 앱 호환 도형, 고객 화면 도형, 공개 사이트 아이콘을 둔다. 고객 상단바 로고는 `customerLogo`로 제공한다. 변경 후 `node scripts/generate-icon-sprite.mjs`로 스프라이트를 만들고 같은 명령에 `--check`를 붙여 검사한다. [Figma 98 Icons](https://www.figma.com/design/cDXVLqZAaWwZeyIo5pqnNl/?node-id=14-2) · [원본 해시](src/assets/icons/figma-export-manifest.json)

Solar의 제작자는 Damir Tuarshe / 480 Design이다. 랜딩의 카카오톡·Instagram 아이콘은 Iconify가 제공하는 Remix Design의 `ri:kakao-talk-fill`과 Pictogrammers의 `mdi:instagram`을 쓴다. MDI의 Brand/Logos에는 별도 상표 조건이 적용된다. [Solar Icon Set](https://github.com/480-Design/Solar-Icon-Set) · [Remix Icon 라이선스](https://github.com/Remix-Design/RemixIcon/blob/master/License) · [MDI 라이선스](https://pictogrammers.com/docs/general/license/)

### 폰트

Pretendard v1.3.9의 가변 서브셋과 Geist Sans v1.8.2를 자체 호스팅한다. 랜딩 문구의 글리프는 `Manspick Landing Sans`와 `Manspick Landing Display`에 담고 새 문자·사용자 입력은 원본 폰트로 폴백한다. 파생본의 고유 이름과 원본의 저작권 고지, Geist의 두 라이선스 파일을 보존한다. [Pretendard](https://github.com/orioncactus/pretendard/tree/v1.3.9) · [서브셋 해시](src/assets/fonts/pretendard/manifest.json) · [Geist](https://github.com/vercel/geist-font/tree/v1.8.2) · [Pretendard OFL](src/assets/fonts/OFL-Pretendard.txt) · [Geist OFL](src/assets/fonts/OFL-Geist.txt) · [Geist LICENSE](src/assets/fonts/LICENSE-Geist.txt)

랜딩 문구를 바꾸면 `node scripts/generate-landing-fonts.mjs --check`를 실행한다. 새 글리프가 필요할 때 아래 명령으로 재생성한다. [생성 설정과 해시](src/assets/fonts/landing/manifest.json)

```sh
python -m pip install --target .local/font-tools --only-binary=:all: --no-deps fonttools==4.68.0 Brotli==1.2.1
node scripts/generate-landing-fonts.mjs
node --test tests/landing-fonts.test.mjs tests/fonts.test.ts
```
