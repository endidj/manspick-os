// 운영자 일정·알림·안내와 관리자 설정 경로에 역할 제한을 연결합니다.
import { Controller, Get, Param, Post } from '@nestjs/common';
import { RequireRole } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { updateSettings } from '../settings/commands.ts';
import { settingsHistory } from '../settings/history.ts';
import { settings } from '../settings/queries.ts';
import { schedule } from '../shoots/schedule.ts';
import { completeNotification, saveTemplate, templates } from './commands.ts';
import { followups } from './followups.ts';
import { listNotifications } from './queries.ts';

@Controller('api')
export class OperationsController {
  @RequireRole('operator')
  @Get('notifications')
  async notifications(@ApiContext() context: RequestContext) {
    return success(await listNotifications(context.env, context.actor));
  }

  @RequireRole('administrator')
  @Get('settings')
  async settings(@ApiContext() context: RequestContext) {
    return success(await settings(context.env, context.actor));
  }

  @RequireRole('administrator')
  @Get('settings/history')
  async settingsHistory(@ApiContext() context: RequestContext) {
    return success(await settingsHistory(context.env, context.actor));
  }

  @RequireRole('administrator')
  @Post('settings')
  async updateSettings(@ApiContext() context: RequestContext) {
    return success(
      await updateSettings(context.env, context.actor, await jsonBody(context.request)),
    );
  }

  @RequireRole('operator')
  @Get('schedule')
  async schedule(@ApiContext() context: RequestContext) {
    return success(
      await schedule(
        context.env,
        context.actor,
        new URL(context.request.url).searchParams.get('week') ?? '',
      ),
    );
  }

  @RequireRole('operator')
  @Get('templates')
  async templates(@ApiContext() context: RequestContext) {
    return success(await templates(context.env, context.actor));
  }

  @RequireRole('administrator')
  @Post('templates/:key')
  async saveTemplate(@ApiContext() context: RequestContext, @Param('key') key: string) {
    return success(
      await saveTemplate(context.env, context.actor, key, await jsonBody(context.request)),
    );
  }

  @RequireRole('operator')
  @Post('notifications/:id/complete')
  async completeNotification(@ApiContext() context: RequestContext, @Param('id') id: string) {
    return success(await completeNotification(context.env, context.actor, id));
  }

  @RequireRole('operator')
  @Get('followups')
  async followups(@ApiContext() context: RequestContext) {
    return success(await followups(context.env, context.actor));
  }
}
