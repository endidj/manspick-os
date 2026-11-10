# @manspick/landing

맨즈픽 서비스 소개·맞춤 추천·로컬 이용 안내를 제공하는 Next.js 앱이다. 실제 상담 채널·결제·리드 저장을 연결하지 않으며 기존 고객/직원 앱 이동을 유지한다.

## 화면과 파일

| 경로·폴더                              | 역할                                                                                                                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/` · `features/landing`               | Hero → Featured In → Problem & Solution → Before & After → Real Impact → 5 HOWs → Team → Reviews → Bridge CTA → Process → Pricing → FAQ → Final CTA, 이후 사이트 Footer |
| `/recommend` · `features/package-quiz` | 원본의 모바일 앱 셸과 5단계 질문·패키지/옵션 비교·합계 안내                                                                                                             |
| `/legal`                               | 기존 서비스·이용·개인정보 안내. 정식 약관으로 표시하지 않음                                                                                                             |
| `features/site`                        | 서버에서 렌더하는 사이트 메뉴·푸터, 작은 Client Component인 상담 안내, 상품 표시 스냅샷                                                                                 |
| `app/api/[...path]`                    | 기존 `@manspick/web/proxy` 연결. 공개 API 범위를 유지                                                                                                                   |

페이지는 기능 폴더의 공개 `index.ts`로 진입한다. `index.ts`는 재수출만 담당한다. 앱 스타일은 CSS Modules로 제한하며 토큰·기본 스타일·폰트는 루트 layout에서 한 번 가져온다.

## 기존 패키지 재사용

- `@manspick/design-system/components`: Brand, AppBar, Button, StepHeader, PriceCard, Accordion, Notice.
- `/patterns`: SectionHeader, ChoiceCard, InfoRow, StickyActionBar. 선택·예산·옵션 수량은 앱이 소유한다.
- `/assets`: `brandImages`와 `BrandImageName`. 공개 검토용 SVG를 Next Image로 표시하고 기존 이미지 크기를 유지한다. 브랜드 이미지는 공용 패키지에, 고객 비공개 업로드는 기존 서버/R2 경계에 둔다.
- `/icons`·`/styles`: 원본 아이콘·자체 호스팅 폰트·semantic/component 토큰. 별도 아이콘·스타일 라이브러리를 추가하지 않는다.
- `@manspick/web/format`: 원화 표시. API 프록시는 기존 web 패키지를 사용한다.

새로 만든 표현은 랜딩에만 필요한 섹션·브랜드 사진 배치와 추천 흐름이다. 공통 입력·선택·가격·FAQ UI는 다시 구현하지 않았다. 사이트 탐색은 실제 링크를 사용하고 모바일 메뉴는 native details로 동작한다.

## 출처와 정책

상단 탐색, 중앙 Hero와 모서리 이미지, 사진과 설명이 교차하는 5 HOWs 등 화면 구조를 확인할 수 있습니다.

사진 자리는 인물이 없는 동일한 시연 이미지로 표시합니다.

추천 질문은 촬영 목적·고민·규모·예산·추가 관심의 5단계다. 1/2는 복수 선택 후 다음, 3/4는 단일 선택 즉시 이동, 5는 선택 없이 결과를 볼 수 있다. 이전 답변으로 돌아가도 선택을 보존한다. 원본에 있는 DSLR·AI 프로필·사진 강의는 현재 판매 catalog에 없어 제외했고, 헤어·의상·코디·쇼핑만 안내한다.

추천 상품은 기존 의상 수 기준을 촬영 규모 ONE/HYBRID/ALL DAY에 연결한다. 목적·고민을 점수화한 전문가 추천이나 검증된 알고리즘으로 표현하지 않는다. 예산은 선택 구성이 범위를 넘을 때 참고 문구를 보여준다. 메인과 추천 화면은 예약과 같은 공개 상품 API에서 판매 중인 상품의 구성과 가격을 가져온다. 최종 구성·일정·가격은 예약에서 다시 확인한다.

답변·옵션은 저장되지 않는다. 배포 빌드에는 `NEXT_PUBLIC_CUSTOMER_APP_ORIGIN`에 고객 앱 주소를 설정한다. 예약 링크는 그 주소의 `/start`로 이동하고, 설정이 없는 로컬 기본값은 `http://localhost:3001/start`다. 직원 앱 링크의 주소는 `NEXT_PUBLIC_ADMIN_APP_ORIGIN`으로 설정할 수 있다. 결과 선택을 예약 데이터로 넘기지 않는다. 보정 평균1~3일·수정 최대3회·후기 확인 후 원본 공개를 유지한다.

## 로컬 확인

```sh
yarn workspace @manspick/landing dev
node node_modules/typescript/bin/tsc --noEmit -p apps/landing/tsconfig.json
node node_modules/eslint/bin/eslint.js apps/landing/src --max-warnings 0
node node_modules/prettier/bin/prettier.cjs --check apps/landing/src apps/landing/README.md
node --test apps/landing/src/features/package-quiz/recommendation.test.ts
```

각 명령은 저장소 루트에서 실행한다. 추천 규칙 테스트는 촬영 규모의 상품 연결·예산 상한 경계를 확인한다. 실제 브라우저에서는 390/1440px 및 작은 모바일의 넘침, 메뉴·FAQ·상담 안내·5단계 왕복·옵션 합계·예약/법률 링크를 확인한다. 관련 전체 회귀·최종3앱 빌드는 root 통합 검증에서 수행한다.

원본의 모든 텍스트·속성·화면 상태와 픽셀 일치 검증은 별도다. 아직 검증되지 않은 후기·언론 정보는 준비 상태로 표시하고, 구형 약관·가격·원본 전달 문구를 실제 정책으로 되살리지 않는다. 원격 Cloudflare 리소스나 배포를 변경하지 않는다.
