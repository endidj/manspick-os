# 랜딩 전용 가변 폰트

고정 랜딩·추천·약관 문구에 필요한 글리프를 원본 폰트에서 추출한 파생본이다. 다른 앱은 기존 폰트를 그대로 사용한다. 폰트 윤곽을 수정하거나 굵기를 정적 인스턴스로 바꾸지 않는다.

| 파생본                       | 원본              |     크기 | CSS 굵기 | 파일 내부 가변 축 |
| ---------------------------- | ----------------- | -------: | -------- | ----------------- |
| ManspickLandingSans.woff2    | Pretendard v1.3.9 | 136,896B | 45–920   | 45–930            |
| ManspickLandingDisplay.woff2 | Geist Sans v1.8.2 |  24,552B | 100–900  | 100–900           |

두 파일 합계는 161,448B다. 기존 메인 첫 화면 측정값 517,012B보다 68.8% 작지만, 실제 앱 전송량은 브라우저 검사 결과로 별도 확인한다. 법률 화면은 표시용 폰트를 preload하지 않는다.

2026-11-17 독립 Chromium 검사에서 전체 고정 글리프와 영문 제목을 390px·1440px, 본문 굵기 400/500/600/700으로 표시했다. 원본은 20파일·578,572B, 파생본은 2파일·161,448B였으며 모든 문단의 위치·크기·줄바꿈이 같았다. 실제 input에 `똠방각하 뷁 힣 ㄱㅏ`를 입력하면 원본 조각이 추가 로드되었고 원본과 글자 폭이 같았다. 이는 전체 문자 집합 검사이며 실제 랜딩의 초기 전송량과 구분한다.

## 생성과 증분 검사

프로젝트에 이미 설치된 TypeScript 파서로 `apps/frontend-landing-page/src`의 JSX 텍스트·문자열·템플릿 고정 구간 및 CSS `content`를 모은다. 주석·테스트는 제외한다. 숫자·영문·구두점은 동적 숫자와 입력을 위해 ASCII 전체와 NBSP를 포함한다. 시계·잔여석·회전 문구·모달·추천 결과도 소스 문자열에 포함되어 수집된다. 사용자가 입력한 개인정보는 수집하지 않는다.

처음 자산을 생성하는 작업 환경에서만 다음 도구를 설치한다. npm·런타임 의존성이 아니며 일반 빌드에서 실행하지 않는다.

```sh
python -m pip install --target .local/font-tools --only-binary=:all: --no-deps fonttools==4.68.0 Brotli==1.2.1
node scripts/generate-landing-fonts.mjs
```

생성 명령은 현재 글리프 집합·생성기 코드·원본/출력 해시가 같으면 Python을 실행하지 않는다. 기존 글자로 문구만 바뀌어도 다시 만들 필요가 없다. 새 글자가 추가되면 원본 폴백으로 즉시 표시되며 다음 명시적 생성에서 파생본에 포함된다.

```sh
node scripts/generate-landing-fonts.mjs --check
node --test tests/landing-fonts.test.mjs tests/fonts.test.ts
```

`--check`와 단위 검사는 Node만 사용하며 자산을 변경하지 않는다. 완전 재생성은 `--force`로 실행한다. `manifest.json`에 원본/출력/생성기/문자 집합 SHA-256, 도구 버전, 지원 문자·가변 범위·윤곽 검증 굵기를 기록한다. 생성 시 모든 포함 문자의 윤곽과 advance width를 원본과 비교하고 unitsPerEm·상하행·행간·가변 축이 보존되었는지 검사한다. 생성 시간은 파일에 넣지 않아 같은 입력이 같은 결과를 만든다.

## 폴백과 화면 적용

`styles/landing-fonts.css`는 원본 `fonts.css`도 가져온다. 새 이름을 앞에, 원본을 뒤에 둔다. Pretendard 92개 공식 unicode subset과 Geist 원본이 남아 있어 드문 이름·새 문구·한글 자모를 계속 표시한다. 파생본은 정확한 `unicode-range`와 `font-display: swap`을 사용한다. 새 글자는 필요한 원본 조각만 추가 요청한다.

표시용 체인은 `Manspick Landing Display → Manspick Landing Sans → Geist → Pretendard` 순서다. 두 파생본이 같은 문자 집합을 사용하므로 새 본문 폰트에만 있는 문자는 원본 Geist에도 없는 문자다. 이 순서는 고정 한글 때문에 Geist 원본을 불필요하게 받지 않으면서 기존 글리프 선택을 유지한다. 새 라틴 문자는 두 파생본에 없어 원본 Geist로, 새 한글은 원본 Pretendard로 폴백한다.

토큰 재정의는 `html[data-manspick-landing]`에 한정한다. 원본 CSS·글리프·타 앱의 폰트 이름은 바꾸지 않는다. `landingFontUrls.body/display`가 CSS와 같은 파일을 preload하며 `criticalFontUrls`는 기존 API로 유지한다.

## OFL과 이름

Pretendard의 Reserved Font Name을 준수하기 위해 파생본의 내부 family/full/PostScript/unique 이름과 CSS 이름을 **Manspick Landing Sans**로 바꿨다. Geist 파생본도 구분되는 **Manspick Landing Display**로 이름을 바꿨다. 원본 저작권·저자·라이선스 메타데이터는 보존한다. 새 이름은 원본과 다른 디자인이라는 뜻이 아니라 수정본의 라이선스상 이름이다.

두 파생본에도 SIL Open Font License 1.1을 적용한다. 배포 시 원본의 [Pretendard OFL](../OFL-Pretendard.txt), [Geist OFL](../OFL-Geist.txt), [Geist LICENSE](../LICENSE-Geist.txt)를 함께 보존한다. 원본 버전·다운로드 URL·해시는 [상위 README](../README.md)에 있다.

도구 근거: [FontTools subset](https://fonttools.readthedocs.io/en/stable/subset/), [FontTools 4.68.0](https://pypi.org/project/fonttools/4.68.0/), [Brotli 1.2.1](https://pypi.org/project/Brotli/1.2.1/).
