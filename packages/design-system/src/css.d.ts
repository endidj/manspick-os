// TypeScript가 CSS Module의 클래스 이름을 읽을 수 있게 합니다.
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
