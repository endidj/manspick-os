# Figma 원본 아이콘

`solar/` 51개, `ri/` 1개, `mdi/` 1개는 Figma `Manspick OS — Customer UI`의 `98 Icons`(14:2)에서 브라우저로 직접 내보낸 SVG 53개다. ZIP의 `icon/` 접두사만 디렉터리 위치에서 제거했다. SVG 파일 내용은 수정하지 않았다. `figma-export-manifest.json`에는 원본별 바이트 수와 SHA-256을 기록했다.

각 원본의 viewBox는 `0 0 24 24`다. 컴포넌트는 SVG의 alpha를 CSS mask로 사용하므로 파일의 색상을 바꾸지 않고 `currentColor`로 표현한다. 원본 이름은 `solar/camera-bold`, `ri/kakao-talk-fill`, `mdi/instagram`처럼 제공한다.

`compat/`의 clock·search·settings·logout·plus 5개는 기존 코드에서 사용하던 도형을 보존한 호환 파일이다. 이 파일들은 Figma 원본 53개로 집계하지 않는다.

## 컬렉션 출처

- Solar Icon Set: [480 Design / Damir Tuarshe](https://github.com/480-Design/Solar-Icon-Set).
- Remix Icon: [Remix Design](https://github.com/Remix-Design/RemixIcon), [공식 라이선스](https://github.com/Remix-Design/RemixIcon/blob/master/License).
- Material Design Icons: [Pictogrammers](https://pictogrammers.com/), [공식 라이선스 안내](https://pictogrammers.com/docs/general/license/).

이 폴더의 파일은 위 저장소에서 새로 받은 파일이 아니라 맨즈픽 Figma에서 내보낸 원본이다. 별도 아이콘 컬렉션으로 판매하거나 재배포하는 패키지가 아니며, 맨즈픽 UI에서 사용하는 자산을 기록한다.

Solar 제작자는 Damir Tuarshe / 480 Design이다. Remix 공식 원문은 2026년 v1.0이며 이 프로젝트의 채널 안내 아이콘 사용과 독립 아이콘 라이브러리 판매를 구분한다. MDI 공식 안내는 Brand/Logos 범주를 일반 Apache 라이선스에서 제외하므로 `mdi/instagram`을 일반 아이콘 라이선스만으로 상표 사용까지 승인된 것으로 간주하지 않는다. 아이콘 이름만으로 맨즈픽의 로고 소유권을 주장하지 않는다.
