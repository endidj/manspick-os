// 업무 규칙을 어겼을 때 호출자에게 전달할 오류를 정의합니다.

export class DomainError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
