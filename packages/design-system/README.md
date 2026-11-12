# @manspick/design-system

맨즈픽 admin/user/landing의 공용 Yarn workspace. Figma 원본 11종, 화면에서 추출한 반복 UI17종, 기존 앱 공통 UI8종과 토큰·폰트·아이콘·Storybook을 포함한다. DB·인증·업무 상태·업로드 네트워크 처리는 앱에 둔다.

## 폴더와 책임

```text
src/
  components/
    button/                 # 구현·공개 index·전용 CSS·예제
    brand/, badge/, ...     # 기존 공통 UI도 각각 한 폴더
    index.ts                # 공개 컴포넌트·타입 재내보내기
  patterns/
    text-field/, dialog/ ... # 입력·선택·요약 등 화면 조합 UI
    index.ts
  tokens/
    primitive.ts            # 원본 기본 값·출처·기존 기본 값 별칭
    semantic.ts             # 배경·글자·상태와 기존 색상 별칭
    component.ts            # 버튼·패널·날짜 칸에 연결한 값
    typography.ts           # 글자 스타일 조합
    index.ts
  icons/                    # SVG 표시 컴포넌트·이름/별칭 목록
  assets/
    icons/, fonts/          # 변경하지 않은 원본과 라이선스
    brand/                  # 시연용 브랜드 이미지·Storybook
    manifest.ts             # 자산 수량·출처·로컬 보관 상태
    index.ts
  styles/
    base.css                # 외부에서 가져오는 스타일 진입점
    tokens.css, fonts.css   # CSS 변수·로컬 폰트
    foundation.css          # reset·글자·기본 입력 요소
    app-components.css      # 기존 공통 UI의 전역 클래스
    app-layout.css          # 기존 앱 배치·사진·폼 전역 클래스
    responsive.css          # 모바일·움직임 줄이기 덮어쓰기
.storybook/                 # 예제 실행·문서·브라우저 테스트 설정
```

모든 `index.ts`는 다른 파일의 값과 타입만 내보낸다. 구현이나 초기화는 각 책임 파일에 둔다. 토큰은 서로 연결되는 네 파일로 묶어 단일 값마다 파일을 만들지 않는다. 이 패키지는 `domain`, `api`, `web`에 의존하지 않으며 업무별 이름·선택 가능 여부·저장 동작을 props와 slot으로 받는다.

기본 컴포넌트14종과 패턴14종의 CSS Module은 각각 구현 옆에 둔다. 공통 상태 규칙도 해당 컴포넌트가 쓰는 selector만 포함하며 기존 선언·우선순위·적용 순서를 유지한다. 기존8종의 전역 클래스는 앱에서도 직접 사용하므로 `app-components.css`에 모아 호환성을 유지한다. `base.css`는 토큰 → 폰트 → 기본 요소 → 기존 공통 UI → 기존 앱 배치 → 반응형 순서로 가져온다. 마지막 반응형 규칙을 앞쪽 파일로 이동하지 않는다.

소스와 설정의 맨 위에는 쉬운 한국어 설명이 있다. 원본 SVG·폰트·라이선스·JSON에는 설명 주석을 넣지 않는다. 자산 설명은 각 자산 폴더의 README와 `manifest.ts`에서 관리한다.

## 실행

저장소 루트에서:

```sh
yarn storybook
# http://127.0.0.1:6006

yarn storybook:browser  # 최초 한 번: Chromium을 .local/playwright에 설치
yarn storybook:test     # 실제 Chromium interaction + axe 접근성 검사
yarn storybook:build    # .local/storybook-static
```

6006이 이미 사용 중이면 두 번째 서버를 띄우지 않고 종료한다. Storybook만 실행해도 D1/R2나 Cloudflare 계정은 필요하지 않다. 정적 빌드·브라우저 바이너리는 gitignore된 `.local`에 저장한다. Storybook은 개발 의존성이며 앱 런타임 의존성이 아니다.

Overview에서 대표 조합을 보고 Foundations·Components·Patterns·Icons에서 개별 props와 상태를 조작한다. Docs/Controls와 접근성 패널을 제공한다. 테스트는 `play`와 `addon-a11y(test:error)`를 사용한다. 네이티브 `<summary>`/`<dialog>`의 Enter/Escape는 Chromium의 trusted keyboard로 확인한다.

상세 실행·검사 방법과 설정은 [Storybook 가이드](../../docs/reference/STORYBOOK.md)를 참고한다.

## 사용

앱 루트 layout에서 스타일을 한 번 가져온다. Next 앱의 `transpilePackages`에는 이 workspace가 등록돼 있다. Vinext의 RSC 빌드가 서버 렌더링 HTML에 스타일 링크를 넣도록 `.css` 확장자가 있는 공개 경로를 사용한다. 기존 `/styles` 경로는 호환성을 위해 유지한다.

```tsx
import '@manspick/design-system/styles.css';
import { Button, PhotoTile } from '@manspick/design-system/components';
import { TextField, Dialog } from '@manspick/design-system/patterns';
import { Icon } from '@manspick/design-system/icons';

<Button
  loading={saving}
  onClick={save}
  trailingIcon={<Icon name="solar/arrow-right-linear" size={18} />}
>
  저장하고 계속
</Button>;
```

`components/button`, `patterns/text-field`처럼 컴포넌트별 공개 index.ts 경로도 지원한다. 루트 barrel에 `use client`를 붙이지 않는다. hooks나 내부 이벤트 연결이 필요한 TextField·TextArea·SelectField·ChipGroup·RadioPills·ChoiceCard·Tabs·Dialog·UploadDropzone·TemplateBlock·Switch는 개별 client 모듈이다. 이벤트 handler를 전달하는 부모는 Next client 경계에서 작성한다. 단순 표시 컴포넌트와 SettingRow는 서버에서 렌더링할 수 있다.

관리자 공통 입력은 `SelectField`(라벨·안내·오류와 native 단일 select), `ChipGroup`(다중 선택/선택 제거), `SettingRow`(제목·설명·현재 값·action slot)를 사용한다. 기존 `Tabs`의 `variant="flush"`는 관리자 원본 여백을 제공하며 같은 키보드/실제 panel 연결을 유지한다. 업무 데이터와 조건 판정·저장은 앱에 둔다. 상세 API와 예제는 [patterns README](src/patterns/README.md)를 참조한다.

`Switch`는 관리자 상품 화면에서 추출한 36×20 토글이다. 필수 `label`과 `checked`/`onCheckedChange`를 받으며 `hideLabel`은 라벨을 시각적으로만 숨긴다. `disabled`·`name`·`value`·`id`·`ref` 등 native input 속성을 지원한다. `className`은 바깥 label에 적용한다. 색상·크기·thumb는 `componentTokens.switch`와 `--mp-switch-*`에 연결하고 저장·권한·로딩 상태는 앱이 결정한다. 상품·부가서비스·편집 창과 템플릿 활성에서 재사용한다. Storybook `Components/Switch`에서 클릭·Space·Tab·disabled·폼 값을 검사한다.

## 원본 대응

공통 컴포넌트가 제공하는 주요 인터페이스입니다.

| UI            | 핵심 인터페이스                                                                       |
| ------------- | ------------------------------------------------------------------------------------- |
| Button        | native props, variant, size, loading, fullWidth, leading/trailingIcon                 |
| TimeSlot      | label, selected, availability; 선택은 onClick                                         |
| DateCell      | day, selected, today, marker, native button props                                     |
| CheckItem     | label, description, completed, trailing                                               |
| PhotoTile     | image slot, label, selected/onSelectedChange, selectionOrder, status/progress/onRetry |
| StepHeader    | title, current, total                                                                 |
| AppBar        | brand, leading, actions slot                                                          |
| StageBadge    | stage, 필수 label, tone                                                               |
| TemplateBlock | message, sent/onSentChange, async onCopy, variableHint                                |
| KanbanCard    | href, title, packageLabel, status slot, dateLabel, assignee, nextAction               |
| NavItem       | href, icon, active, badge, native anchor props                                        |

추가 UI는 고객, 랜딩, 추천, 직원 화면의 반복 구성을 모았습니다.

| UI                                    | 책임                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| TextField / TextArea                  | controlled value/onValueChange, label/hint/error/required, native input props                               |
| RadioPills / ChoiceCard               | 결제 경로·추천/옵션 선택, 선택 상태·disabled·설명                                                           |
| SectionHeader / SummaryCard / InfoRow | 제목·요약·메타 정보와 action slot                                                                           |
| StickyActionBar                       | 안전 영역과 하단 CTA 조합. 위치 정책은 앱 className으로 조정                                                |
| Tabs                                  | controlled value/items, 좌우/Home/End 포커스, Enter/Space 수동 활성화                                       |
| Dialog                                | controlled open/onOpenChange, modal/drawer, title/description/actions, native focus containment/Escape/복귀 |
| UploadDropzone                        | accept/multiple/disabled, 파일 선택·drop의 FileList 전달                                                    |
| PriceCard / Accordion                 | 가격·기능·action 전달, native details/summary FAQ                                                           |

기존 Brand·Badge·Panel·Field·EmptyState·Notice·Loading·Steps는 호환용이다. 앱의 예약 시간·사진 셀렉·운영 메뉴/카드는 새 UI로 옮겼다. 모든 기존 화면을 Figma와 픽셀 단위로 재구현한 범위는 아니다.

## 토큰·폰트·아이콘

- `tokens`는 primitive → semantic → component 3단계와 typography11종을 제공한다. `styles/tokens.css`에서 같은 값을 CSS custom properties로 쓴다. 색상·폰트·굵기·크기·간격·radius는 원본에서 확인했고 line-height/letter-spacing과 CSS 이름은 구현 보완이다.
- 기본 primary 버튼·선택 날짜/시간/사진 순번 배경은 Figma 원본 blue500이다. 파란 StageBadge 글자는 blue300을 쓴다. 기본 색과 hover 색은 별도 토큰으로 유지한다.
- 2026-11-06 사용자 결정으로 원본 blue500(`#2D76F6`)/흰 글자를 그대로 유지한다. 작은 글자의 대비는 약4.17:1로 WCAG AA 4.5:1에 못 미친다. Storybook은 이 조합을 쓰는 primary 버튼·선택 날짜/시간·추천 라벨의 `color-contrast`만 명시적으로 예외 처리하고 다른 색상·이름·키보드·포커스 검사는 유지한다. 해당 예제는 실제 배경/글자 색을 별도 검사한다. 따라서 Storybook 통과는 이 대비 조합의 접근성 충족을 뜻하지 않는다.
- 앱 색상은 semantic `--mp-color-*`, 글자 크기·굵기·행간은 `--mp-type-*`를 먼저 사용한다. 내부 화면의 보라/분홍 상태와 채널 미리보기·사진 오버레이는 공통 semantic 토큰으로 확장했다. 화면 CSS에 HEX/RGB·반복 글자 크기를 복사하지 않는다.
- Pretendard/Geist WOFF2를 자체 호스팅하며 OFL·해시·출처를 [fonts README](src/assets/fonts/README.md)에 보관한다. Pretendard는 공식 dynamic subset 92개를 `unicode-range`로 선택 로딩하고, Geist는 기존 약70KB 가변 파일을 사용한다. 전체 Pretendard 원본은 보존하지만 앱 CSS에서 참조하지 않으며 폰트를 전역 preload하지 않는다.
- SVG는 Solar 아이콘 51개, 일반 채널 시연 아이콘 2개와 호환 도형 5개를 포함합니다. [아이콘 출처와 라이선스](src/assets/icons/README.md)
- Icon 기본24px, CSS mask/currentColor. label이 없으면 장식용, 있으면 role=img. PhotoTile의 image에 native image/Next Image를 전달하고 URL·비공개 접근 정책은 앱에서 결정한다.
- 브랜드 이미지 47개 항목은 540×720 시연 SVG를 공유합니다. /assets의 brandImages·BrandImageName으로 참조하고, Storybook에서 각 이미지 항목의 로딩과 크기를 확인합니다. [브랜드 이미지](src/assets/brand/README.md)

## 소비자가 지켜야 할 계약

Button의 기본 type은 button이다. 폼 제출에는 `type="submit"`을 지정한다. 아이콘만 넣는 버튼에는 aria-label을 준다. DateCell은 aria-label에 보이는 day를 접두사로 보존한다. PhotoTile의 label은 footer의 보이는 컷 번호를 포함해야 한다.

PhotoTile은 장수 제한·결제·권한을 판단하지 않는다. 앱이 선택 가능 여부를 disabled로 전달하며 제출 이후 중복 변경을 막는다. DateCell은 단일 버튼이고 달력 전체의 roving focus나 날짜 계산을 포함하지 않는다. 업로더는 파일 선택 UI이며 파일 보안 검사·진행·네트워크 재시도는 서버/앱에 남는다.

StageBadge 원본은 2=설문/3=일정이고 최신 업무 규칙은 순서가 다르다. `label`을 필수로 받아 업무 상태의 명시적 매핑을 요구한다. source preset은 원본 예시용이다. PriceCard의 가격·정책과 TemplateBlock의 변수 치환도 소비자가 전달한다. 복사/수동 발송 완료 표시는 실제 외부 메시지 전송을 뜻하지 않는다.

컴포넌트 CSS Modules와 custom properties를 사용하고 앱별 스타일을 분리한다. `sideEffects: ["**/*.css"]`로 스타일 누락을 방지한다. 동적 이름을 받는 Icon manifest의 정적 URL은 번들에 포함되며 모든 SVG가 개별 tree shaking된다고 주장하지 않는다.

자동 a11y/interaction 검사는 지원 범위의 증거다. 모든 브라우저, 모든 화면 픽셀 비교, 86개 제품 수용 기준 전체 검증과 구분한다.
