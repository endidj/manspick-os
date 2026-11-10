// 디자인 시스템에서 URL로 불러오는 SVG의 타입을 선언합니다.
declare module '*.svg?url' {
  const url: string;
  export default url;
}
