// 관리자 전용 직원 계정 등록·변경과 세션 회수 경로를 연결합니다.
import { Controller, Get, Param, Post } from '@nestjs/common';
import { RequireRole } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody, requiredText } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { changeStaffAccount, listStaffAccounts, registerStaffAccount } from './staff-accounts.ts';

@Controller('api/staff')
export class StaffController {
  @RequireRole('administrator')
  @Get()
  async list(@ApiContext() context: RequestContext) {
    return success(await listStaffAccounts(context.env, context.actor));
  }

  @RequireRole('administrator')
  @Post()
  async register(@ApiContext() context: RequestContext) {
    const body = await jsonBody(context.request);
    return success(
      await registerStaffAccount(context.request, context.env, context.actor, {
        name: requiredText(body, 'name', 100),
        email: requiredText(body, 'email', 254),
        role: body.role,
      }),
      201,
    );
  }

  @RequireRole('administrator')
  @Post(':id')
  async update(@ApiContext() context: RequestContext, @Param('id') id: string) {
    const body = await jsonBody(context.request);
    return success(
      await changeStaffAccount(context.request, context.env, context.actor, id, {
        action: 'update',
        version: body.version,
        role: body.role,
        active: body.active,
      }),
    );
  }

  @RequireRole('administrator')
  @Post(':id/revoke-sessions')
  async revokeSessions(@ApiContext() context: RequestContext, @Param('id') id: string) {
    const body = await jsonBody(context.request);
    return success(
      await changeStaffAccount(context.request, context.env, context.actor, id, {
        action: 'revoke_sessions',
        version: body.version,
      }),
    );
  }
}
