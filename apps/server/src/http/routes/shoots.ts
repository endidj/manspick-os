// 로그인한 사용자의 촬영 목록·상세·업무 명령 API를 연결합니다.
import { Hono } from 'hono';
import { completeShootMessage, shootMessages } from '../../activity/shoot-messages.ts';
import { act } from '../../shoots/actions.ts';
import { listBoardShoots, listShoots, shootDetail } from '../../shoots/queries.ts';
import type { AuthenticatedEnvironment } from '../context.ts';
import { jsonBody, pathParam } from '../input.ts';
import { requireOperator } from '../middleware.ts';
import { success } from '../responses.ts';

export const shootRoutes = new Hono<AuthenticatedEnvironment>();

shootRoutes.get('/shoots/:shootId/messages', async (context) =>
  success(
    await shootMessages(context.env, context.get('actor'), pathParam(context.req, 'shootId')),
  ),
);
shootRoutes.post('/shoots/:shootId/messages/:templateKey/complete', async (context) =>
  success(
    await completeShootMessage(
      context.env,
      context.get('actor'),
      pathParam(context.req, 'shootId'),
      pathParam(context.req, 'templateKey'),
    ),
  ),
);

shootRoutes.get('/shoots', async (context) =>
  success(
    await listShoots(
      context.env,
      context.get('actor'),
      context.req.query('includeCancelled') === 'true',
      { cursor: context.req.query('cursor') },
    ),
  ),
);
shootRoutes.get('/shoots/board', requireOperator, async (context) =>
  success(
    await listBoardShoots(context.env, context.get('actor'), new URL(context.req.url).searchParams),
  ),
);
shootRoutes.get('/shoots/:shootId', async (context) =>
  success(await shootDetail(context.env, context.get('actor'), pathParam(context.req, 'shootId'))),
);
shootRoutes.post('/shoots/:shootId/actions', async (context) =>
  success(
    await act(
      context.env,
      context.get('actor'),
      pathParam(context.req, 'shootId'),
      await jsonBody(context.req.raw),
    ),
  ),
);
