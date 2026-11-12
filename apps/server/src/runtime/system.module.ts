// 시스템 상태와 공개 업무 기준 API를 구성합니다.
import { Module } from '@nestjs/common';
import { SystemController } from './system.controller.ts';

@Module({ controllers: [SystemController] })
export class SystemModule {}
