// 운영 조회와 관리자 설정 API의 HTTP 경계를 구성합니다.
import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller.ts';

@Module({ controllers: [OperationsController] })
export class OperationsModule {}
