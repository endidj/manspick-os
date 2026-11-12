// 로그인 사용자의 파일 목록·업로드와 비공개 다운로드 경로를 연결합니다.
import { DomainError } from '@manspick/domain';
import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiContext } from '../http/context.ts';
import type { RequestContext } from '../http/context.ts';
import { success } from '../http/responses.ts';
import { listUploads } from './queries.ts';
import { download, upload } from './uploads.ts';

@Controller('api/uploads')
export class FilesController {
  @Get()
  async list(@ApiContext() context: RequestContext) {
    const shootId = new URL(context.request.url).searchParams.get('shootId');
    if (!shootId) throw new DomainError('SHOOT_REQUIRED', '촬영을 선택해주세요.');
    return success(await listUploads(context.env, context.actor, shootId));
  }

  @Post()
  async upload(@ApiContext() context: RequestContext) {
    return success(await upload(context.request, context.env, context.actor), 201);
  }

  @Get(':uploadId/blob')
  download(@ApiContext() context: RequestContext, @Param('uploadId') uploadId: string) {
    return download(context.request, context.env, context.actor, uploadId);
  }
}
