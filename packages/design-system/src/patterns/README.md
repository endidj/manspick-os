# 화면 패턴

공용 표현과 브라우저 상호작용만 제공한다. 고객 정보·예약·결제·알림·파일 저장·인가를 가져오지 않는다. `patterns/index.ts`에는 `use client`를 붙이지 않으며, 상태나 hook이 필요한 파일에만 클라이언트 경계를 둔다.

| 패턴            | 경계        | 근거 / 책임                                                                                                                                                             |
| --------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TextField       | client      | 13px 라벨, 12px 안내, 입력 높이 56, white 3%, radius 12, border white 8%, 파란 포커스. 제어 입력·native 속성·오류 연결                                                  |
| TextArea        | client      | 동일 입력 패턴을 여러 줄로 확장한 구현 보완                                                                                                                             |
| RadioPills      | client      | C1-b 결제 경로 pill. native radio/fieldset, 선택·비활성·필수                                                                                                            |
| ChoiceCard      | client      | 추천 선택 카드의 radius 16, padding 20, gap 16, 제목 15/600·설명 12. 선택 아이콘 24px을 전달할 수 있고 native radio 또는 checkbox를 사용. 자동 다음 단계 이동은 앱 책임 |
| SectionHeader   | server safe | C1-b STEP 1 + H1 24px + 설명 14px                                                                                                                                       |
| SummaryCard     | server safe | C1-b 선택한 옵션 + 값 + 변경 링크 구성                                                                                                                                  |
| InfoRow         | server safe | 반복되는 안내 속성의 label/value 표시                                                                                                                                   |
| StickyActionBar | server safe | C1-b 상단 border + 전체 너비 56px 버튼을 담는 in-flow sticky 영역. 버튼·활성 조건은 호출자가 제공                                                                       |
| Tabs            | client      | 접근성 보완. 방향키/Home/End로 포커스 이동, Enter/Space로 활성화. 비활성 탭 건너뜀                                                                                      |
| Dialog          | client      | native `<dialog>.showModal()`이 배경 inert, 포커스 유지, Escape, 닫은 뒤 포커스 복귀 제공                                                                               |
| UploadDropzone  | client      | native 파일 선택/드롭을 FileList callback으로 전달. 업로드·용량/MIME/내용 검증은 호출자 책임                                                                            |

## 관리자 화면에서 추출한 패턴

| 패턴        | 경계        | 인터페이스와 책임                                                                                                                                                                                                                                                   |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SelectField | client      | native 단일 select. 필수 label/value/onValueChange/options, hint/error/hideLabel과 native ref/name/form/disabled/required를 지원한다. className은 select에 적용한다. 관리자 선택 입력의 높이40·elevated·subtle border·radius8을 토큰으로 유지한다.                  |
| ChipGroup   | client      | 필수 label/options/value[]/onValueChange. select는 aria-pressed 토글, remove는 선택 항목 제거 버튼이며 알 수 없는 기존 선택값도 제거할 수 있다. hideLabel·disabled·개별 option disabled를 지원한다. 기존 Button을 사용하고 AND/OR·권한·저장·다이얼로그는 앱에 둔다. |
| SettingRow  | server safe | label/description/value/actions와 default/compact density. 값 0을 보존하고 좁은 화면에서 줄바꿈한다. native div 속성은 바깥 행에 전달하며 저장과 편집 동작은 slot의 소비자가 결정한다.                                                                              |

세 패턴은 기존 관리자 구현에서 추출했으며 별도 Figma 원본 컴포넌트가 있다고 주장하지 않는다. 각각 전용 폴더의 구현·CSS Module·재수출 index.ts·Storybook을 제공한다. 배경·글자·간격·radius는 기존 semantic/type 토큰을 재사용한다.

레이아웃 반응형 처리와 오류·키보드 상태를 포함합니다.

브라우저 동작 근거: [W3C Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), [Chrome Dialog guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-components/dialog). Dialog에 별도 포커스 트랩·inert 제어를 중복 구현하지 않는다.

모든 입력은 controlled props를 쓴다. Form의 서버 검증은 별도로 필요하다. StickyActionBar는 fixed overlay가 아니므로 내용 흐름에 자신의 높이를 남기며, iOS safe area를 고려한다. 모바일 화면을 담는 상위 컨테이너의 overflow와 sticky 기준은 앱에서 검증한다.

`Tabs`의 기본 표현은 유지한다. `variant="flush"`는 관리자 상품/운영 탭의 수평 여백과 panel 간격을 제공하며, 미선택 글자색은 공통 secondary 토큰을 재사용한다. 실제 콘텐츠를 해당 TabItem의 `content`에 전달하고 선택 상태와 다른 외부 영역에 배치하지 않는다. 방향키/Home/End는 포커스를, Enter/Space는 선택을 바꾼다.

Storybook에는 14개 패턴 예시와 입력 오류·라디오·동의 필수/선택·탭 키보드·모달 열기/닫기 및 포커스 복귀·다중 파일 선택·native select 폼/ref·칩 선택/제거/disabled·설정 행 동작 play 검증이 있다. 스토리의 고객명/가격/동의 문구/파일은 설명용 예시이며 운영 데이터나 확정 약관을 뜻하지 않는다.
