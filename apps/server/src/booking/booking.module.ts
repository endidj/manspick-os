// 상품 조회와 예약 접수의 HTTP 경계를 구성합니다.
import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller.ts';

@Module({ controllers: [BookingController] })
export class BookingModule {}
