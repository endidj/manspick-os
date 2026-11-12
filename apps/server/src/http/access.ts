// Nest 메타데이터와 가드로 공개 경로·세션·운영자·관리자 접근을 제한합니다.
import { Inject, Injectable, SetMetadata } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { administrator, operator } from '../security/permissions.ts';
import { requireActor } from '../security/sessions.ts';
import type { ApiRequest } from './context.ts';

const PUBLIC = Symbol('public');
const ROLE = Symbol('role');

export const Public = () => SetMetadata(PUBLIC, true);

export const RequireRole = (role: 'operator' | 'administrator') => SetMetadata(ROLE, role);

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  async canActivate(host: ExecutionContext) {
    const context = host.switchToHttp().getRequest<ApiRequest>().apiContext;
    const targets = [host.getHandler(), host.getClass()];
    if (this.reflector.getAllAndOverride(PUBLIC, targets)) return true;
    context.actor = await requireActor(context.request, context.env);
    const role = this.reflector.getAllAndOverride<string>(ROLE, targets);
    if (role === 'administrator') administrator(context.actor);
    if (role === 'operator') operator(context.actor);
    return true;
  }
}
