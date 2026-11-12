// 로그인한 사용자의 촬영 조회·안내·업무 명령을 해당 업무 함수에 연결합니다.
import { Controller, Get, Param, Post } from '@nestjs/common';
import { completeShootMessage, shootMessages } from '../activity/shoot-messages.ts';
import { RequireRole } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { act } from './actions.ts';
import { listBoardShoots, listShoots, shootDetail } from './queries.ts';

@Controller('api/shoots')
export class ShootsController {
  @Get(':shootId/messages')
  async messages(@ApiContext() context: RequestContext, @Param('shootId') shootId: string) {
    return success(await shootMessages(context.env, context.actor, shootId));
  }

  @Post(':shootId/messages/:templateKey/complete')
  async completeMessage(
    @ApiContext() context: RequestContext,
    @Param('shootId') shootId: string,
    @Param('templateKey') templateKey: string,
  ) {
    return success(await completeShootMessage(context.env, context.actor, shootId, templateKey));
  }

  @Get()
  async list(@ApiContext() context: RequestContext) {
    const query = new URL(context.request.url).searchParams;
    return success(
      await listShoots(context.env, context.actor, query.get('includeCancelled') === 'true', {
        cursor: query.get('cursor') ?? undefined,
      }),
    );
  }

  @RequireRole('operator')
  @Get('board')
  async board(@ApiContext() context: RequestContext) {
    return success(
      await listBoardShoots(context.env, context.actor, new URL(context.request.url).searchParams),
    );
  }

  @Get(':shootId')
  async detail(@ApiContext() context: RequestContext, @Param('shootId') shootId: string) {
    return success(await shootDetail(context.env, context.actor, shootId));
  }

  @Post(':shootId/actions')
  async action(@ApiContext() context: RequestContext, @Param('shootId') shootId: string) {
    return success(await act(context.env, context.actor, shootId, await jsonBody(context.request)));
  }
}
