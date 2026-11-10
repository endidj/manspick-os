# 디자인 시스템 Storybook

공통 React 컴포넌트는 Next.js 앱과 독립적으로 `@storybook/react-vite`에서 실행한다. 앱의 API·고객 세션·Cloudflare 리소스는 필요하지 않다. 설정은 [공식 React-Vite 안내](https://storybook.js.org/docs/get-started/frameworks/react-vite), [Vitest 통합](https://storybook.js.org/docs/writing-tests/integrations/vitest-addon/index), [접근성 테스트](https://storybook.js.org/docs/writing-tests/accessibility-testing)를 따른다.

스토리와 설정 파일의 경로는 [`packages/design-system`](../../packages/design-system/README.md)을 기준으로 한다.

## 로컬 실행

저장소 루트에서 실행한다.

```sh
yarn storybook
yarn storybook:build
yarn storybook:test
yarn workspace @manspick/design-system typecheck:storybook
```

개발 주소는 `http://127.0.0.1:6006`이다. 외부 인터페이스에 바인딩하지 않고 브라우저를 자동으로 열지 않는다. 포트가 사용 중이면 실패한다. 정적 산출물은 저장소의 `.local/storybook-static`에 생성하며 배포하지 않는다. Storybook 원격 측정은 비활성화한다.

## 테스트

처음 한 번 `yarn storybook:browser`로 테스트용 Chromium을 저장소의 `.local/playwright`에 설치한다. `storybook:test`는 별도 Storybook 서버 없이 Chromium에서 각 story를 렌더링하고 `play`의 상호작용 assertion과 axe 접근성 검사를 수행한다. `yarn storybook:watch`는 테스트를 관찰 모드로 실행한다. Vitest 서버도 로컬 주소만 사용한다. 각 명령은 `yarn workspace @manspick/design-system storybook`, `build-storybook`, `test-storybook`, `test-storybook:watch`, `storybook:browser`로도 실행할 수 있다.

스토리는 `src/**/*.stories.ts` 또는 `.tsx`에 작성한다. 타입은 `@storybook/react-vite`, 상호작용 도구는 `storybook/test`에서 가져온다. 기본 `a11y.test: 'error'`로 위반을 실패 처리한다. 접근성 검사는 키보드·스크린 리더·시각 검토를 대체하지 않는다. 알려진 문제를 숨기기 위해 검사나 규칙을 전체 비활성화하지 않는다.

## CSS·폰트·자산

preview는 실제 패키지의 `src/styles/base.css`를 직접 가져온다. CSS에서 상대 경로로 참조하는 로컬 폰트와 자산은 Vite가 처리한다. 고정 URL이 필요한 자산은 `.storybook/public`에 두면 정적 빌드에도 복사된다. 테스트도 같은 폴더를 사용한다. Storybook 설정 자체는 외부 폰트·이미지 CDN을 요청하지 않는다. 폰트 파일은 사용 허가와 출처를 확인한 뒤 저장한다.

## 버전 고정

2026-11-06 공식 npm 레지스트리 조회 기준, 출시 후 최소 7일이 지난 안정판을 선택했다. Storybook과 addon은 `10.6.5`, Vitest 관련 패키지는 `5.0.5`, Vite는 `8.3.5`, React plugin은 `6.1.2`, Playwright는 `1.64.1`로 정확히 고정한다. React·React DOM은 프로젝트와 같은 `19.3.1`이다. Yarn의 패키지 격리 보호 설정은 변경하지 않는다.
