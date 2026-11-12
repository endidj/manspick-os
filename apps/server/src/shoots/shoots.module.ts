// 촬영 조회와 변경 API를 구성하고 기존 업무 검증·저장 로직을 재사용합니다.
import { Module } from '@nestjs/common';
import { ShootsController } from './shoots.controller.ts';

@Module({ controllers: [ShootsController] })
export class ShootsModule {}
