-- 기존 촬영을 유지하면서 판매 당시의 내역, 일정 후보, 담당 이력과 실제 확정을 분리합니다.
ALTER TABLE staff ADD COLUMN hired_on TEXT CHECK(hired_on IS NULL OR (date(hired_on) IS NOT NULL AND date(hired_on)=hired_on));

CREATE TABLE orders (
 id TEXT NOT NULL PRIMARY KEY,
 customer_id TEXT REFERENCES customers(id),
 package_id TEXT NOT NULL REFERENCES packages(id),
 package_name TEXT,
 package_price_krw INTEGER CHECK(package_price_krw>=0),
 shoot_duration_minutes INTEGER CHECK(shoot_duration_minutes>0),
 total_amount_krw INTEGER NOT NULL CHECK(total_amount_krw>=0),
 sales_channel TEXT,
 platform_nickname TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE order_items (
 order_id TEXT NOT NULL REFERENCES orders(id),
 item_id TEXT NOT NULL REFERENCES addons(id),
 inclusion_type TEXT NOT NULL CHECK(inclusion_type IN ('included','additional')),
 item_name TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price_krw INTEGER NOT NULL CHECK(unit_price_krw>=0),
 PRIMARY KEY(order_id,item_id,inclusion_type),
 CHECK(inclusion_type!='included' OR unit_price_krw=0)
);
CREATE TABLE bookings (
 id TEXT NOT NULL PRIMARY KEY REFERENCES shoots(id),
 order_id TEXT NOT NULL UNIQUE REFERENCES orders(id),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE booking_time_options (
 id TEXT NOT NULL PRIMARY KEY,
 booking_id TEXT NOT NULL REFERENCES bookings(id),
 starts_at TEXT NOT NULL,
 UNIQUE(booking_id,starts_at),
 UNIQUE(booking_id,id)
);
CREATE TABLE booking_staff (
 id INTEGER PRIMARY KEY,
 booking_id TEXT NOT NULL REFERENCES bookings(id),
 staff_id TEXT NOT NULL REFERENCES staff(id),
 role TEXT NOT NULL CHECK(role IN ('director','cs','retoucher')),
 assigned_at TEXT NOT NULL,
 released_at TEXT
);
CREATE UNIQUE INDEX booking_current_staff_role ON booking_staff(booking_id,role) WHERE released_at IS NULL AND role IN ('director','retoucher');
CREATE UNIQUE INDEX booking_current_staff ON booking_staff(booking_id,staff_id,role) WHERE released_at IS NULL;
CREATE TABLE director_availability (
 director_id TEXT NOT NULL REFERENCES staff(id),
 starts_at TEXT NOT NULL,
 ends_at TEXT NOT NULL,
 CHECK(julianday(starts_at) IS NOT NULL AND julianday(ends_at)>julianday(starts_at) AND julianday(ends_at) IS NOT NULL),
 PRIMARY KEY(director_id,starts_at)
);
CREATE TABLE booking_confirmations (
 booking_id TEXT NOT NULL PRIMARY KEY REFERENCES bookings(id),
 option_id TEXT NOT NULL,
 confirmed_by_staff_id TEXT NOT NULL REFERENCES staff(id),
 location TEXT NOT NULL CHECK(length(trim(location))>0),
 confirmed_at TEXT NOT NULL,
 occupancy_starts_at TEXT NOT NULL,
 occupancy_ends_at TEXT NOT NULL CHECK(occupancy_ends_at>occupancy_starts_at),
 FOREIGN KEY(booking_id,option_id) REFERENCES booking_time_options(booking_id,id)
);
CREATE INDEX confirmation_occupancy ON booking_confirmations(confirmed_by_staff_id,occupancy_starts_at,occupancy_ends_at);

-- 기존 앱과 마이그레이션 이후 입력되는 시드도 동일한 판매 스냅샷을 생성합니다.
CREATE VIEW legacy_order_snapshots AS SELECT s.id,s.customer_id,s.package_id,
 CASE WHEN json_valid(s.package_snapshot) THEN json_extract(s.package_snapshot,'$.name') END AS package_name,
 CASE WHEN json_valid(s.package_snapshot) THEN json_extract(s.package_snapshot,'$.price') END AS package_price_krw,
 CASE WHEN json_valid(s.package_snapshot) THEN json_extract(s.package_snapshot,'$.duration') END AS shoot_duration_minutes,
 s.total_amount AS total_amount_krw,s.created_at,s.created_at AS updated_at
 FROM shoots s;
INSERT INTO orders(id,customer_id,package_id,package_name,package_price_krw,shoot_duration_minutes,total_amount_krw,created_at,updated_at)
 SELECT * FROM legacy_order_snapshots;
INSERT INTO bookings SELECT id,id,created_at,created_at FROM shoots;
INSERT INTO order_items SELECT shoot_id,addon_id,'additional',name,quantity,unit_price FROM shoot_addons;
INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT id,director_id,'director',created_at FROM shoots WHERE director_id IS NOT NULL;
INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT id,retoucher_id,'retoucher',created_at FROM shoots WHERE retoucher_id IS NOT NULL;
CREATE TRIGGER booking_snapshot_insert AFTER INSERT ON shoots BEGIN
 INSERT INTO orders(id,customer_id,package_id,package_name,package_price_krw,shoot_duration_minutes,total_amount_krw,created_at,updated_at)
  SELECT * FROM legacy_order_snapshots WHERE id=NEW.id;
 INSERT INTO bookings VALUES(NEW.id,NEW.id,NEW.created_at,NEW.created_at);
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.director_id,'director',NEW.created_at WHERE NEW.director_id IS NOT NULL;
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.retoucher_id,'retoucher',NEW.created_at WHERE NEW.retoucher_id IS NOT NULL;
END;
CREATE TRIGGER booking_staff_director_update AFTER UPDATE OF director_id ON shoots WHEN OLD.director_id IS NOT NEW.director_id BEGIN
 UPDATE booking_staff SET released_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE booking_id=NEW.id AND role='director' AND released_at IS NULL;
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.director_id,'director',strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NEW.director_id IS NOT NULL;
END;
CREATE TRIGGER booking_staff_retoucher_update AFTER UPDATE OF retoucher_id ON shoots WHEN OLD.retoucher_id IS NOT NEW.retoucher_id BEGIN
 UPDATE booking_staff SET released_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE booking_id=NEW.id AND role='retoucher' AND released_at IS NULL;
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.retoucher_id,'retoucher',strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NEW.retoucher_id IS NOT NULL;
END;
CREATE TRIGGER booking_updated AFTER UPDATE OF version ON shoots WHEN NEW.version!=OLD.version BEGIN
 UPDATE bookings SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER booking_addon_snapshot AFTER INSERT ON shoot_addons BEGIN
 INSERT INTO order_items VALUES(NEW.shoot_id,NEW.addon_id,'additional',NEW.name,NEW.quantity,NEW.unit_price) ON CONFLICT(order_id,item_id,inclusion_type) DO NOTHING;
END;
ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);
UPDATE payments SET order_id=shoot_id;
CREATE INDEX payment_order_state ON payments(order_id,state);
CREATE UNIQUE INDEX payment_booking_identity ON payments(id,shoot_id);
UPDATE orders SET sales_channel=(SELECT p.channel FROM payments p WHERE p.shoot_id=orders.id AND p.kind='base' ORDER BY p.id LIMIT 1);
CREATE TRIGGER payment_order_link AFTER INSERT ON payments BEGIN
 UPDATE payments SET order_id=NEW.shoot_id WHERE id=NEW.id AND order_id IS NULL;
 UPDATE orders SET sales_channel=NEW.channel WHERE id=NEW.shoot_id AND NEW.kind='base' AND sales_channel IS NULL;
END;
CREATE TRIGGER payment_order_scope_insert BEFORE INSERT ON payments WHEN NEW.order_id IS NOT NULL AND NEW.order_id IS NOT NEW.shoot_id
 BEGIN SELECT RAISE(ABORT,'CHECK payment order'); END;
CREATE TRIGGER payment_order_scope_update BEFORE UPDATE OF order_id,shoot_id ON payments WHEN NEW.order_id IS NOT NEW.shoot_id
 BEGIN SELECT RAISE(ABORT,'CHECK payment order'); END;

CREATE TABLE deposit_reports (
 request_id TEXT NOT NULL PRIMARY KEY REFERENCES requests(id),
 payment_id TEXT NOT NULL REFERENCES payments(id)
);
CREATE INDEX deposit_report_payment ON deposit_reports(payment_id);
CREATE TRIGGER deposit_report_scope BEFORE INSERT ON deposit_reports WHEN NOT EXISTS(
 SELECT 1 FROM requests r JOIN payments p ON p.shoot_id=r.shoot_id
 WHERE r.id=NEW.request_id AND r.type='deposit' AND p.id=NEW.payment_id)
 BEGIN SELECT RAISE(ABORT,'CHECK deposit payment'); END;
-- 텍스트로만 남은 신고는 당시 서버가 기록한 결제 번호를 정확하게 확인할 때만 연결합니다.
INSERT INTO deposit_reports(request_id,payment_id)
 SELECT r.id,p.id FROM requests r JOIN payments p ON p.shoot_id=r.shoot_id
 WHERE r.type='deposit' AND substr(r.message,-length(' · 결제 '||p.id))=(' · 결제 '||p.id);
