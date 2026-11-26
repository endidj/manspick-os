// 지표 조회와 방문 기록의 API 경로를 등록합니다.
import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller.ts';

@Module({ controllers: [AnalyticsController] })
export class AnalyticsModule {}
