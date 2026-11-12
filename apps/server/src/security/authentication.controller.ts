// 고객·직원 인증, 로컬 시연과 세션 경로를 기존 인증 업무에 연결합니다.
import { Controller, Get, Param, Post } from '@nestjs/common';
import { Public } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody, requiredText } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { demoData } from '../runtime/demo.ts';
import { issueCustomerLink } from './customer-link.ts';
import { customerLogin } from './customer-login.ts';
import { logout } from './sessions.ts';
import {
  confirmStaffLogin,
  demoLogin,
  requestStaffLogin,
  staffLoginOptions,
} from './staff-login.ts';

@Controller('api')
export class AuthenticationController {
  @Public()
  @Get('auth/staff/options')
  options(@ApiContext() context: RequestContext) {
    return success(staffLoginOptions(context.request, context.env));
  }

  @Public()
  @Post('auth/staff/request')
  async requestStaffLogin(@ApiContext() context: RequestContext) {
    const body = await jsonBody(context.request);
    return success(
      await requestStaffLogin(context.request, context.env, requiredText(body, 'email', 254)),
      202,
    );
  }

  @Public()
  @Post('auth/staff/confirm')
  async confirmStaffLogin(@ApiContext() context: RequestContext) {
    const body = await jsonBody(context.request);
    const result = await confirmStaffLogin(
      context.request,
      context.env,
      requiredText(body, 'token', 200),
    );
    return success(result.data, 200, [result.cookie]);
  }

  @Public()
  @Post('auth/customer')
  async customerLogin(@ApiContext() context: RequestContext) {
    const body = await jsonBody(context.request);
    const result = await customerLogin(
      context.request,
      context.env,
      requiredText(body, 'token', 200),
      requiredText(body, 'last4', 4),
    );
    return success(result.data, 200, [result.cookie]);
  }

  @Public()
  @Post('demo/session')
  async demoLogin(@ApiContext() context: RequestContext) {
    const body = await jsonBody(context.request);
    const result = await demoLogin(context.request, context.env, requiredText(body, 'role', 20));
    return success(result.data, 200, [result.cookie]);
  }

  @Public()
  @Post('auth/logout')
  async logout(@ApiContext() context: RequestContext) {
    return success({ ok: true }, 200, await logout(context.request, context.env));
  }

  @Public()
  @Get('demo')
  async demo(@ApiContext() context: RequestContext) {
    return success(await demoData(context.request, context.env));
  }

  @Post('auth/customer-link/:shootId')
  async customerLink(@ApiContext() context: RequestContext, @Param('shootId') shootId: string) {
    return success(await issueCustomerLink(context.request, context.env, context.actor, shootId));
  }

  @Get('session')
  session(@ApiContext() context: RequestContext) {
    const { actor } = context;
    return success({ actor, ...(actor.shootId ? { shootId: actor.shootId } : {}) });
  }
}
