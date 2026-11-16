# 맨즈픽 원본 사이트 포팅 계획

> 초기 포팅 단계의 보관 기록이다. 이후 사용자의 원본 완전 재현 요청으로 디자인·가격·추천·애니메이션 기준을 원본 사이트로 변경했다. 모든 앱의 색인도 차단했다. 현재 구현과 검증 결과는 [최종 마이그레이션 기록](../reference/23-landing-site-migration.md)을 따른다.

기준: `JeongWhale/manspick-site` main `54f4a375b5c3babe9f9bb82ac423c4be6686fb60` (2026-11-16 열람).

1. 기존 landing 소개·사이트 셸·추천 화면을 교체한다. 앱 설정과 공개 API 프록시는 유지한다.
2. 원본 섹션 순서, 텍스트, 사진, 상담 채널, 팀 갤러리와 추천 흐름을 React 서버/클라이언트 컴포넌트로 포팅한다. CDN 스크립트와 전역 DOM 변경은 가져오지 않는다.
3. 공용 Button, Brand, Accordion, PriceCard, Dialog, ChoiceCard, 아이콘·자체 호스팅 폰트를 재사용한다. 앱 배치는 CSS Modules에, 원본의 큰 제목 토큰과 추가 사진은 design-system에 둔다.
4. 가격·옵션·보정·원본 공개는 현재 catalog/domain 및 고객 앱 정책에 맞춘다. 과거 잔여석·가짜 실시간 알림·접수 확인 없는 Google Forms 제출은 재현하지 않는다. 상담·가이드 요청은 원본 카카오 채널로 연결한다.
5. 운영 canonical·OG·구조화 데이터·robots·sitemap, 미리보기 noindex, 기존 `.html` 주소 영구 이동을 적용한다.
6. 추천 점수/옵션 경계와 SEO 정책 테스트, SSR·이미지·모바일 메뉴·FAQ·갤러리·추천 브라우저 검증, typecheck/lint/format/test/build를 수행한다.

변경 전 회귀 근거: `tests/web.test.ts`, `tests/public-test.test.ts` 7개 통과. 추천 기존 테스트 2개 통과. 고객/직원 인증·저장·파일 접근은 교체 범위 밖이다.

## 구현·검증 결과 (2026-11-16)

가이드북 신청은 최종 구현에서 원본 Google Forms의 폼과 entry 키를 유지하는 native POST로 옮겼다. 필수 입력·동의 후 새 탭의 실제 접수 결과를 확인하며, 앱에서 성공을 추정하지 않는다. 카카오 상담도 유지한다.

- 전체 단위·회귀 검사 139개 통과. 추천 6개, SEO 5개 포함.
- 실제 로컬 Chromium 추천 5개·메인 랜딩 5개 검사 통과. 320/390/1440px, 모든 사진 디코딩, JavaScript 없는 SSR 내용과 가격, 메뉴·갤러리 키보드, 폼 필드와 POST 계약 확인. 외부 전송은 차단했다.
- 전체 typecheck·ESLint와 변경 파일 Prettier 확인. 서버 dry-run 및 landing/customer/admin production 빌드 통과.
- production Worker를 로컬 3005에서 실행해 메인·추천·법률 페이지·sitemap·OG·favicon 200, 브랜드 제목·canonical·기본 noindex, hero 사진 로딩, localhost 링크 없음, 브라우저 오류 없음 확인.
- Vinext/Vite 빌드의 sourcemap·중복 dynamic import 경고는 남지만 빌드는 성공했다. 원본과 데스크톱·모바일 렌더를 비교했으며 픽셀 동일성이나 전체 애니메이션 복제를 주장하지 않는다.

Yarn Corepack의 온라인 다운로드가 제한된 환경에서는 설치된 `node_modules`의 해당 CLI와 `scripts/check.mjs`, `scripts/build.mjs`를 직접 실행했다. 원격 배포·실제 상담 접수·가이드 발송은 수행하지 않았다. 운영 색인과 고객·직원 앱 origin 설정은 [마이그레이션 기록](../reference/23-landing-site-migration.md)을 따른다.
