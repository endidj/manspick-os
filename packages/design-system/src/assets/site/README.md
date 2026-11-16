# 운영 사이트 사진과 웹용 사본

출처: [JeongWhale/manspick-site](https://github.com/JeongWhale/manspick-site/tree/54f4a375b5c3babe9f9bb82ac423c4be6686fb60), commit `54f4a375b5c3babe9f9bb82ac423c4be6686fb60`.

`originals/`의 사진 72개(74,144,842bytes)는 원본 저장소와 운영 사이트의 바이트가 모두 일치한다. 파일명·확장자·픽셀·자르기를 변경하지 않았으며 [manifest.json](originals/manifest.json)에 SHA-256과 크기를 기록했다. 공개 사이트를 동일하게 포팅하라는 프로젝트 소유자의 요청에 따라 보존한다. 사진 저작권은 원본 소유자에게 있다.

원본은 재편집과 품질 비교용으로 보존하며 앱에서 직접 import하지 않는다. `source-images.ts`는 `generated/`의 메타데이터 없는 WebP만 참조한다. 따라서 원본 EXIF/GPS·카메라·촬영자·XMP·ICC 정보가 웹용 사진에 포함되지 않는다. 원본의 깨진 소문자 `team-influencer-7.jpg` 요청은 실제 대문자 `7.JPG` 이름에 연결된다.

## 생성과 캐시

```sh
yarn images:generate  # 사진 추가·교체나 변환 설정 변경 때 실행
yarn images:check     # 인코딩 없이 원본/출력 해시·메타데이터·생성 모듈 최신 여부 확인
```

`scripts/generate-site-images.mjs`는 기존 Sharp 0.35.5를 고정해 사용한다. 새 사진은 `originals/manifest.json`의 파일명·바이트 수·SHA-256을 먼저 갱신한다. 생성된 WebP·manifest·source-images.ts를 함께 커밋한다. 일반 앱 빌드에는 이미지 인코딩 단계를 연결하지 않는다.

- EXIF 방향을 픽셀에 반영한 뒤 sRGB로 변환하고 모든 메타데이터를 제거한다. 자르기와 투명도를 유지한다.
- WebP 품질 88·effort 4·alphaQuality 100. 기본 너비 480/960/1600px를 원본 너비 이내로 제한한다. 작은 사진을 확대 생성하지 않는다.
- 36–40px 아바타로 쓰는 hero-after 1–4, 스타일링 포트폴리오 1–10에만 96/192px 사본을 추가한다.
- 원본 해시·너비 목록·변환 설정·Sharp/libvips/libwebp 버전이 캐시 키다. 출력 파일 해시와 실제 메타데이터도 확인하므로 변경 없는 파일은 재인코딩하지 않고 누락·손상된 사본만 복구한다.
- `--check`는 누락·손상·오래된 결과나 생성 모듈을 실패로 보고하고 파일을 쓰지 않는다. 단위 검사에도 포함된다.
- 원본 하나와 네이티브 스레드 하나씩 처리하고 캐시를 32MB로 제한한다. 오래된 파일은 검증된 `generated/` 안의 생성 파일만 정리하며 `originals/`는 삭제하거나 수정하지 않는다.

2026-11-17 측정에서 원본 72개 74,144,842bytes가 반응형 사본 182개 19,462,480bytes로 줄었다(전체 저장 용량 약 73.8% 감소). 실제 페이지 전송량은 브라우저가 선택한 규격과 지연 로딩에 따라 달라진다. 첫 생성은 다른 작업으로 부하가 큰 Windows 호스트에서 574.4초가 걸렸으며 일반적인 빌드 시간의 기준으로 삼지 않는다. 변경 없이 다시 실행한 결과는 4.146초, 재사용 182개, 인코딩 0개였다.

## 앱 공개 API

`@manspick/design-system/assets`에서 다음 정보를 제공한다. 이미지 표시 크기에 맞는 `sizes`를 앱/컴포넌트에서 지정한다.

```ts
sourceImages[name]; // src, srcSet, width, height, thumbnailSrc, variants
sourceImageUrls[name]; // 기존 API 호환용 웹용 기본 src
type SourceImageName; // 원본 파일명을 키로 사용
```

`width`·`height`는 방향을 반영한 원본의 비율이다. `variants`는 각 WebP의 실제 픽셀 크기를 담는다. 기본 src는 960px 이하 사본 중 가장 큰 파일이며 `srcSet`에는 사용 가능한 모든 규격이 들어간다. 브라우저는 `sizes`와 DPR에 맞춰 선택한다. `thumbnailSrc`는 192px 이상인 가장 작은 사본이며 원본이 더 작으면 최대 규격을 쓴다. 아바타용 소형 규격을 만들지 않은 사진에서는 첫 일반 규격을 사용한다.
