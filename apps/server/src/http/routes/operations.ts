// 운영자 알림과 관리자 설정 API에 해당 역할 검사를 연결합니다.
import { Hono } from 'hono';
import { listNotifications } from '../../activity/queries.ts';
import { settings } from '../../settings/queries.ts';
import { settingsHistory } from '../../settings/history.ts';
import { updateSettings } from '../../settings/commands.ts';
import { completeNotification, saveTemplate, templates } from '../../activity/commands.ts';
import { schedule } from '../../shoots/schedule.ts';
import { followups } from '../../activity/followups.ts';
import { jsonBody, pathParam } from '../input.ts';
import type { AuthenticatedEnvironment } from '../context.ts';
import { requireAdministrator, requireOperator } from '../middleware.ts';
import { success } from '../responses.ts';

export const operationRoutes = new Hono<AuthenticatedEnvironment>();

operationRoutes.get('/notifications', requireOperator, async (context) =>
  success(await listNotifications(context.env, context.get('actor'))),
);
operationRoutes.get('/settings', requireAdministrator, async (context) =>
  success(await settings(context.env, context.get('actor'))),
);
operationRoutes.get('/settings/history', requireAdministrator, async (context) =>
  success(await settingsHistory(context.env, context.get('actor'))),
);
operationRoutes.post('/settings', requireAdministrator, async (context) =>
  success(await updateSettings(context.env, context.get('actor'), await jsonBody(context.req.raw))),
);
operationRoutes.get('/schedule', requireOperator, async (context) =>
  success(await schedule(context.env, context.get('actor'), context.req.query('week') ?? '')),
);
operationRoutes.get('/templates', requireOperator, async (context) =>
  success(await templates(context.env, context.get('actor'))),
);
operationRoutes.post('/templates/:key', requireAdministrator, async (context) =>
  success(
    await saveTemplate(
      context.env,
      context.get('actor'),
      pathParam(context.req, 'key'),
      await jsonBody(context.req.raw),
    ),
  ),
);
operationRoutes.post('/notifications/:id/complete', requireOperator, async (context) =>
  success(
    await completeNotification(context.env, context.get('actor'), pathParam(context.req, 'id')),
  ),
);
operationRoutes.get('/followups', requireOperator, async (context) =>
  success(await followups(context.env, context.get('actor'))),
);
