// 공개 상태 확인과 촬영 단계 목록을 Nest HTTP 경로에 연결합니다.
import { STATUSES, STAGE_LABELS } from '@manspick/domain';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { success } from '../http/responses.ts';
import { health } from './health.ts';

@Controller('api')
export class SystemController {
  @Public()
  @Get('health')
  async health(@ApiContext() context: RequestContext) {
    return success(await health(context.request, context.env));
  }

  @Public()
  @Get('statuses')
  statuses() {
    return success({ statuses: STATUSES, stages: STAGE_LABELS });
  }
}
