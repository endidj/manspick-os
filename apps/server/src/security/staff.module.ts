// 관리자 전용 직원 계정 관리 API를 구성합니다.
import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller.ts';

@Module({ controllers: [StaffController] })
export class StaffModule {}
