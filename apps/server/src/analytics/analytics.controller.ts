// 공개 이벤트 수집과 관리자 전용 지표 조회를 분리합니다.
import { Controller, Get, Post } from '@nestjs/common';
import { Public, RequireRole } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { metrics, recordEvent } from './analytics.ts';

@Controller('api/analytics')
export class AnalyticsController {
  @Public()
  @Post('events')
  async record(@ApiContext() context: RequestContext) {
    await recordEvent(context.env, context.request, await jsonBody(context.request));
    return success({ accepted: true }, 202);
  }

  @RequireRole('administrator')
  @Get('metrics')
  async report(@ApiContext() context: RequestContext) {
    return success(await metrics(context.env));
  }
}
