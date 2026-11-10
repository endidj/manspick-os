// 공개 상태 확인과 촬영 단계 목록 API를 연결합니다.
import { STATUSES, STAGE_LABELS } from '@manspick/domain';
import { Hono } from 'hono';
import { health } from '../../runtime/health.ts';
import type { ApiEnvironment } from '../context.ts';
import { success } from '../responses.ts';

export const systemRoutes = new Hono<ApiEnvironment>();

systemRoutes.get('/health', async (context) => success(await health(context.req.raw, context.env)));
systemRoutes.get('/statuses', () => success({ statuses: STATUSES, stages: STAGE_LABELS }));
