// 파일 접근 권한을 유지하면서 HTTP 업로드와 다운로드를 구성합니다.
import { Module } from '@nestjs/common';
import { FilesController } from './files.controller.ts';

@Module({ controllers: [FilesController] })
export class FilesModule {}
