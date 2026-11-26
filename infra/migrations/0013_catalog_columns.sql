-- 카탈로그 금액·시간 단위를 명시하고, 기존 자료의 생성 시각과 최근 수정 시각을 구분합니다.
ALTER TABLE packages RENAME COLUMN price TO price_krw;
ALTER TABLE packages RENAME COLUMN original_price TO original_price_krw;
ALTER TABLE packages RENAME COLUMN duration TO shoot_duration_minutes;
ALTER TABLE packages RENAME COLUMN active TO is_active;
ALTER TABLE packages ADD COLUMN created_at TEXT;
ALTER TABLE packages ADD COLUMN updated_at TEXT;
ALTER TABLE items ADD COLUMN created_at TEXT;
ALTER TABLE items ADD COLUMN updated_at TEXT;
ALTER TABLE booking_notes ADD COLUMN updated_at TEXT;
UPDATE booking_notes SET updated_at=created_at;
-- 원래 생성 시각이 없는 과거 상품에 마이그레이션 시각을 생성 시각으로 기록하지 않습니다.
CREATE TRIGGER stamp_package_insert AFTER INSERT ON packages BEGIN
 UPDATE packages SET created_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER stamp_package_update AFTER UPDATE OF name,price_krw,original_price_krw,shoot_duration_minutes,outfits,retouch_count,description,is_active ON packages BEGIN
 UPDATE packages SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER stamp_item_insert AFTER INSERT ON items BEGIN
 UPDATE items SET created_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER stamp_item_update AFTER UPDATE OF name,unit_price_krw,description,max_quantity,active ON items BEGIN
 UPDATE items SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER stamp_note_insert AFTER INSERT ON booking_notes BEGIN
 UPDATE booking_notes SET updated_at=NEW.created_at WHERE id=NEW.id;
END;
CREATE TRIGGER stamp_note_update AFTER UPDATE OF text ON booking_notes WHEN NEW.text!=OLD.text BEGIN
 UPDATE booking_notes SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
ALTER TABLE payments ADD COLUMN provider TEXT;
ALTER TABLE payments ADD COLUMN provider_transaction_id TEXT;
CREATE UNIQUE INDEX payment_provider_transaction ON payments(provider,provider_transaction_id) WHERE provider IS NOT NULL AND provider_transaction_id IS NOT NULL;
CREATE TRIGGER guard_payment_reference BEFORE UPDATE OF provider,provider_transaction_id ON payments WHEN (NEW.provider IS NULL)!=(NEW.provider_transaction_id IS NULL) BEGIN
 SELECT RAISE(ABORT,'CHECK payment provider transaction');
END;
CREATE TRIGGER guard_payment_reference_insert BEFORE INSERT ON payments WHEN (NEW.provider IS NULL)!=(NEW.provider_transaction_id IS NULL) BEGIN
 SELECT RAISE(ABORT,'CHECK payment provider transaction');
END;
UPDATE staff SET hired_on='2024-01-01' WHERE id='demo-director' AND hired_on IS NULL;
