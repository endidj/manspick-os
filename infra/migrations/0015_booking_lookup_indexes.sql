-- 촬영 목록의 결제·대기 알림과 촬영별 최근 이력을 인덱스로 조회합니다.
CREATE INDEX payments_shoot_kind ON payments(shoot_id, kind);
CREATE INDEX notifications_pending_shoot ON notifications(shoot_id) WHERE state = 'local_pending';
CREATE INDEX booking_events_booking_created ON booking_events(booking_id, created_at DESC);

-- payments.id 기본키가 결제 한 건을 식별하므로 기존 복합 인덱스는 중복입니다.
DROP INDEX payment_booking_identity;
