// 로그인한 사용자의 파일 목록·업로드·비공개 다운로드 API를 연결합니다.
import { DomainError } from '@manspick/domain';
import { Hono } from 'hono';
import { listUploads } from '../../files/queries.ts';
import { download, upload } from '../../files/uploads.ts';
import type { AuthenticatedEnvironment } from '../context.ts';
import { pathParam } from '../input.ts';
import { success } from '../responses.ts';

export const uploadRoutes = new Hono<AuthenticatedEnvironment>();

uploadRoutes.get('/uploads', async (context) => {
  const shootId = new URL(context.req.url).searchParams.get('shootId');
  if (!shootId) throw new DomainError('SHOOT_REQUIRED', '촬영을 선택해주세요.');
  return success(await listUploads(context.env, context.get('actor'), shootId));
});
uploadRoutes.post('/uploads', async (context) =>
  success(await upload(context.req.raw, context.env, context.get('actor')), 201),
);
uploadRoutes.get('/uploads/:uploadId/blob', (context) =>
  download(context.req.raw, context.env, context.get('actor'), pathParam(context.req, 'uploadId')),
);
