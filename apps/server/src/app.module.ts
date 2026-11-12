// 기능 모듈과 전역 접근 가드·예외 필터를 공통 API로 조립합니다.
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { OperationsModule } from './activity/operations.module.ts';
import { BookingModule } from './booking/booking.module.ts';
import { FilesModule } from './files/files.module.ts';
import { AccessGuard } from './http/access.ts';
import { ApiExceptionFilter } from './http/exception.filter.ts';
import { NotFoundController } from './http/not-found.controller.ts';
import { SystemModule } from './runtime/system.module.ts';
import { AuthenticationModule } from './security/authentication.module.ts';
import { StaffModule } from './security/staff.module.ts';
import { ShootsModule } from './shoots/shoots.module.ts';

@Module({
  controllers: [NotFoundController],
})
class NotFoundModule {}

@Module({
  imports: [
    SystemModule,
    BookingModule,
    AuthenticationModule,
    ShootsModule,
    FilesModule,
    OperationsModule,
    StaffModule,
    NotFoundModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
