// 공개 로그인 경로와 보호된 세션 조회 경로를 구성합니다.
import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller.ts';

@Module({ controllers: [AuthenticationController] })
export class AuthenticationModule {}
