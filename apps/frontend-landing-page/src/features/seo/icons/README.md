# 랜딩 아이콘

`originals/favicon.ico`는 기존 256×256 ICO를 수정 없이 보관합니다. 원본의 색상·질감·투명도를 유지하며, 256px PNG는 원본 픽셀과 동일합니다.

- `favicon.ico`: 16·32·48px PNG 프레임. 탭 아이콘과 `public/favicon.ico` 호환 경로에 사용합니다.
- `apple-touch-icon.png`: iOS 홈 화면용 180px PNG.
- `icon-256.png`: 큰 아이콘을 지원하는 브라우저용 256px PNG.
- `manifest.json`: 원본 SHA-256, 생성 옵션, 결과 파일의 크기와 SHA-256.

메타데이터에서는 `?url`로 가져와 파일 내용이 바뀌면 URL도 바뀝니다. PNG에는 EXIF·GPS·XMP·IPTC·주석·ICC를 넣지 않습니다. 기존 Sharp를 사용하고, 일반 앱 빌드에서는 다시 압축하지 않습니다.

저장소 루트에서 필요한 경우에만 생성합니다.

```sh
node scripts/generate-site-icons.mjs
node scripts/generate-site-icons.mjs --check
```

검사 모드는 원본·옵션·결과 해시와 공개 호환 경로를 확인하며 파일을 생성하지 않습니다. 원본 교체 시에는 생성기의 원본 해시와 디코딩 전제, 픽셀 보존 테스트를 함께 검토합니다.
