-- 예약과 함께 고객 링크 안내를 기록하고, 발송 대기 중인 주소는 암호문으로만 보관합니다.
CREATE TABLE booking_link_notifications (
 shoot_id TEXT PRIMARY KEY REFERENCES shoots(id) ON DELETE CASCADE,
 state TEXT NOT NULL CHECK(state IN ('pending','accepted','failed','cancelled','simulated','unavailable')),
 payload TEXT,
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,
 CHECK ((state='pending') = (payload IS NOT NULL))
);
CREATE INDEX booking_link_notifications_due ON booking_link_notifications(next_attempt_at) WHERE state='pending';

CREATE TRIGGER cancel_booking_link_notification AFTER UPDATE OF access_token_hash,status ON shoots
WHEN NEW.access_token_hash <> OLD.access_token_hash OR NEW.status='cancelled'
BEGIN
 UPDATE booking_link_notifications SET state='cancelled',payload=NULL WHERE shoot_id=NEW.id AND state='pending';
END;
