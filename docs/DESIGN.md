# 맨즈픽 OS 시각 기준

[디자인 시스템 명세](reference/03-design-system.md)의 Figma 토큰과 컴포넌트를 기준으로 화면을 설계한다.

- 고객/운영은 Operate, 공개 랜딩은 Persuade. 기존 Figma의 시각 체계를 유지한다.
- 배경 #0A0A0A, 표면 #141416/#1C1C1F, 주요 텍스트 #F5F5F5, 보조 #A1A1AA, 강조 #2D76F6.
- 4px 간격 체계와 12/16px radius, 컴팩트한 운영 목록과 넓은 고객 행동 영역.
- 모든 반복 UI는 packages/design-system의 공개 경로와 CSS custom properties를 사용한다.
- 본문 한글은 디자인 시스템이 자체 호스팅하는 Pretendard를 사용한다. 미확보 폰트·사진을 원본과 같다고 주장하지 않는다.
- 고객 화면은 고정 폭 스마트폰 모형이 아니라 좁은 기기부터 데스크톱까지 동작하는 반응형 웹이다.
- 상태는 색·문구를 함께, 포커스·대기·오류·빈 상태를 명시한다. motion은 reduced-motion을 따른다.
