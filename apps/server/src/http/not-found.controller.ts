// 미등록 경로와 지원하지 않는 메서드도 공통 인증을 거쳐 기존 404를 반환합니다.
import { All, Controller } from '@nestjs/common';
import { notFound } from './responses.ts';

@Controller()
export class NotFoundController {
  @All('{*path}')
  handle() {
    return notFound();
  }
}
