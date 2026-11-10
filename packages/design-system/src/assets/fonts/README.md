# 자체 호스팅 폰트

공식 저장소의 버전 고정 WOFF2를 수정하지 않고 보관한다. 앱은 공용 `styles/fonts.css`를 통해 Pretendard 공식 dynamic subset과 기존 Geist 가변 파일을 사용하며 외부 폰트 CDN을 요청하지 않는다. 기존 전체 Pretendard 파일은 원본으로 보존하며 앱 CSS에서 참조하지 않는다.

| 파일                     | 원본                                                                                                                                                      |    바이트 | SHA-256                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------: | ------------------------------------------------------------------ |
| PretendardVariable.woff2 | [Pretendard v1.3.9](https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2) | 2,057,688 | `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4` |
| GeistVariable.woff2      | [Geist Sans v1.8.2](https://raw.githubusercontent.com/vercel/geist-font/v1.8.2/fonts/Geist/webfonts/Geist%5Bwght%5D.woff2)                                |    69,760 | `2ffebe993e969069a9789d15164b7715d42491b5835516c5e3b935d5f81b05f1` |

Pretendard의 공식 가변 범위는 45–920, Geist Sans는 100–900이다. Figma에서 확인한 사용 굵기는 Pretendard 400/500/600/700, Geist 600/700이다. 파일 헤더 `wOF2`와 위 해시를 다운로드 후 확인했다.

## Pretendard dynamic subset

- 출처: [v1.3.9 공식 CSS](https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/packages/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css).
- `pretendard/pretendardvariable-dynamic-subset.css`는 공식 CSS 원문이다. 같은 버전의 `pretendard/woff2-dynamic-subset/` WOFF2 92개를 변경 없이 보관한다.
- [manifest.json](pretendard/manifest.json)에 버전·출처 URL·CSS SHA-256·각 WOFF2의 크기와 SHA-256을 기록했다.
- 앱의 `styles/fonts.css`는 기존 토큰과 호환되도록 폰트 이름을 `Pretendard Variable`에서 `Pretendard`로 연결하고 URL을 로컬 경로로 바꿨다. 공식 `unicode-range`·굵기 45–920·`font-display: swap`은 유지한다.
- 한글 완성형 11,172자·기본 영문·숫자·기호·자모를 검사한다. 일부 자주 쓰는 한글만 추리지 않고 공식 문자 범위 전체를 보존하므로 드문 이름도 필요한 조각을 추가 로드한다.
- `assetManifest.fonts.bytes`는 사용 가능한 서브셋 전체와 Geist의 합계이며 첫 화면 전송량이 아니다. `originalsBytes`는 런타임에서 제외한 전체 Pretendard 원본의 크기다.

## 라이선스

둘 다 SIL Open Font License 1.1이다. 상업용 웹사이트에 포함하여 자체 호스팅할 수 있다. 배포하는 폰트에 저작권 고지와 라이선스를 함께 포함하고, 폰트 자체만 판매하지 않으며, 폰트의 재배포는 OFL 조건을 따른다. 수정 버전은 해당 배포본의 Reserved Font Name 제한을 확인해야 한다. 앱 코드에 OFL을 적용한다는 의미는 아니다.

- [Pretendard 원문 LICENSE](https://raw.githubusercontent.com/orioncactus/pretendard/v1.3.9/LICENSE) → `OFL-Pretendard.txt`. Reserved Font Name: Pretendard.
- [Geist v1.8.2 LICENSE.txt](https://raw.githubusercontent.com/vercel/geist-font/v1.8.2/LICENSE.txt) → `LICENSE-Geist.txt`.
- [Geist v1.8.2 OFL.txt](https://raw.githubusercontent.com/vercel/geist-font/v1.8.2/OFL.txt) → `OFL-Geist.txt`.

Geist 동일 태그에 저작권 고지가 서로 다른 LICENSE.txt/OFL.txt가 함께 있어 두 원문을 보존했다. 라이선스 파일을 다른 버전의 내용으로 교체하지 않는다.

## 전송량

Pretendard 서브셋 92개의 저장 크기는 2,957,724바이트이고 Geist를 더하면 3,027,484바이트다. 조각별 메타데이터로 전체 저장 크기는 늘어나지만 브라우저는 화면에 해당 문자가 있는 조각만 요청한다. 폰트는 전역 preload하지 않는다.

로컬 Chromium에서 캐시 없는 별도 컨텍스트로 1440px·390px을 각각 검사했다. 같은 문장을 400/500/600/700으로 표시하고 Geist 제목을 함께 로드했으며 아래 값은 CSS를 제외한 WOFF2 응답 본문 합계다. 실제 앱의 첫 화면 전송량은 표시하는 문자의 종류에 따라 달라진다.

| 샘플                                           | 기존 전체 폰트 | 서브셋 적용 | Pretendard 조각 수 |
| ---------------------------------------------- | -------------: | ----------: | -----------------: |
| 영문 알파벳·숫자                               |     2,127,448B |    107,756B |                  1 |
| `나의 매력을 발견하는 시간, 맨즈픽 0123456789` |     2,127,448B |    226,492B |                  6 |
| `똠방각하 뷁 힣 ㄱㄴㄷ ㅏㅣ 한글 English`      |     2,127,448B |    357,860B |                 10 |

두 화면 폭에서 기존 폰트와 글자 폭·높이·줄바꿈이 같았고 전체 Pretendard 파일이나 외부 CDN 요청은 없었다. `node --test tests/fonts.test.ts`로 원본 해시·로컬 WOFF2·한글/영문 범위·공식 서브셋 대응과 파일 해시를 검사한다. Storybook Typography interaction에서도 한글·영문·드문 글자의 실제 로딩을 확인한다.

프로덕션 빌드한 랜딩 `/`도 로컬에서 별도로 확인했다. 1440px·390px 모두 Pretendard 조각 11개와 Geist 1개, 합계 355,776바이트를 요청했다. 모든 폰트는 같은 호스트에서 로드됐고 전체 Pretendard 파일 요청이나 페이지·리소스 오류는 없었다. 측정일은 2026-11-06이다.
