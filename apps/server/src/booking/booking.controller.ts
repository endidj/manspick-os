// 공개 상품과 예약 가능 일정, 신규 예약 접수 경로를 연결합니다.
import { Controller, Get, Post } from '@nestjs/common';
import { Public } from '../http/access.ts';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { jsonBody } from '../http/input.ts';
import { success } from '../http/responses.ts';
import { calendar } from './calendar.ts';
import { catalog } from './catalog.ts';
import { start } from './start.ts';

@Controller('api')
export class BookingController {
  @Public()
  @Get('catalog')
  async catalog(@ApiContext() context: RequestContext) {
    return success(await catalog(context.env));
  }

  @Public()
  @Get('calendar')
  async calendar(@ApiContext() context: RequestContext) {
    const query = new URL(context.request.url).searchParams;
    return success(
      await calendar(
        context.env,
        query.get('packageId') ?? 'one',
        query.get('shopping') === 'true',
        (query.get('addons') ?? '').split(',').filter(Boolean),
      ),
    );
  }

  @Public()
  @Post('start')
  async start(@ApiContext() context: RequestContext) {
    return success(await start(context.request, context.env, await jsonBody(context.request)), 201);
  }
}
