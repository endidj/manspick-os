// 상품·예약 가능 일정·신규 예약 API를 해당 업무 함수에 연결합니다.
import { Hono } from 'hono';
import { calendar } from '../../booking/calendar.ts';
import { catalog } from '../../booking/catalog.ts';
import { start } from '../../booking/start.ts';
import type { ApiEnvironment } from '../context.ts';
import { jsonBody } from '../input.ts';
import { success } from '../responses.ts';

export const bookingRoutes = new Hono<ApiEnvironment>();

bookingRoutes.get('/catalog', async (context) => success(await catalog(context.env)));
bookingRoutes.get('/calendar', async (context) => {
  const query = new URL(context.req.url).searchParams;
  return success(
    await calendar(
      context.env,
      query.get('packageId') ?? 'one',
      query.get('shopping') === 'true',
      (query.get('addons') ?? '').split(',').filter(Boolean),
    ),
  );
});
bookingRoutes.post('/start', async (context) =>
  success(await start(context.req.raw, context.env, await jsonBody(context.req.raw)), 201),
);
