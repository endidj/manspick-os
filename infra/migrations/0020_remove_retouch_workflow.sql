-- 촬영 이후 결과물은 외부에서 전달합니다. 예약·수납·업로드와 작성자 이력은 보존합니다.
DROP TRIGGER booking_snapshot_insert;
DROP TRIGGER booking_staff_retoucher_update;
DROP TRIGGER booking_staff_director_update;
DROP TRIGGER item_default_packages;
DROP TRIGGER package_default_items;
DROP TRIGGER stamp_package_update;
DROP TRIGGER maximum_three_revisions;
DROP TRIGGER deposit_report_scope;
DROP INDEX shoots_retoucher;
DROP INDEX booking_current_staff_role;
DROP INDEX booking_current_staff;
DROP INDEX one_open_request;

-- 이전 보정 및 셀렉 자료는 직원이 볼 수 있는 비공개 촬영 자료로 편입합니다.
DROP TABLE photo_metadata;
DROP TABLE request_items;
DROP TABLE retouch_orders;
DROP TABLE selections;
DROP TABLE photos;
DROP TABLE file_links;
DROP TABLE external_file_links;
ALTER TABLE uploads DROP COLUMN retouch_job_id;
DROP TABLE retouch_jobs;
DROP TABLE retoucher_rules;
UPDATE uploads SET kind='internal_photo',visible=0
WHERE kind IN ('candidate','retouched','revision','original');
INSERT INTO booking_photos(id,booking_id,object_key,original_filename,mime_type,size_bytes,uploaded_by_staff_id,uploaded_at)
SELECT u.id,u.shoot_id,u.object_key,u.name,u.content_type,u.size,u.uploaded_by,u.created_at
FROM uploads u JOIN staff s ON s.id=u.uploaded_by
WHERE u.kind='internal_photo' AND NOT EXISTS(SELECT 1 FROM booking_photos WHERE id=u.id)
  AND NOT (u.uploaded_by='demo-retoucher' AND u.object_key LIKE 'demo/%' AND NOT EXISTS(SELECT 1 FROM requests r WHERE r.upload_id=u.id));
-- 시연용 결과 파일은 원래 촬영자의 데이터가 아니므로 계정에 귀속시키지 않습니다.
DELETE FROM uploads WHERE uploaded_by='demo-retoucher' AND object_key LIKE 'demo/%'
  AND NOT EXISTS(SELECT 1 FROM booking_photos p WHERE p.id=uploads.id)
  AND NOT EXISTS(SELECT 1 FROM requests r WHERE r.upload_id=uploads.id);

DELETE FROM campaign_claims WHERE request_id IN (SELECT id FROM requests WHERE type IN ('revision','extra_retouch'));
DELETE FROM requests WHERE type IN ('revision','extra_retouch');
ALTER TABLE requests ADD COLUMN new_type TEXT NOT NULL DEFAULT 'deposit' CHECK(new_type IN ('deposit','review'));
UPDATE requests SET new_type=type;
ALTER TABLE requests DROP COLUMN type;
ALTER TABLE requests RENAME COLUMN new_type TO type;
CREATE UNIQUE INDEX one_open_request ON requests(shoot_id,type) WHERE state IN ('new','processing');
CREATE TRIGGER deposit_report_scope BEFORE INSERT ON deposit_reports WHEN NOT EXISTS(
 SELECT 1 FROM requests r JOIN payments p ON p.shoot_id=r.shoot_id
 WHERE r.id=NEW.request_id AND r.type='deposit' AND p.id=NEW.payment_id)
 BEGIN SELECT RAISE(ABORT,'CHECK deposit payment'); END;

DELETE FROM booking_staff WHERE role='retoucher';
ALTER TABLE booking_staff ADD COLUMN new_role TEXT NOT NULL DEFAULT 'director' CHECK(new_role IN ('director','cs'));
UPDATE booking_staff SET new_role=role;
ALTER TABLE booking_staff DROP COLUMN role;
ALTER TABLE booking_staff RENAME COLUMN new_role TO role;
CREATE UNIQUE INDEX booking_current_staff_role ON booking_staff(booking_id,role) WHERE released_at IS NULL AND role='director';
CREATE UNIQUE INDEX booking_current_staff ON booking_staff(booking_id,staff_id,role) WHERE released_at IS NULL;
ALTER TABLE shoots DROP COLUMN retoucher_id;
ALTER TABLE shoots DROP COLUMN select_by;
ALTER TABLE shoot_workspace DROP COLUMN selection_reason;
ALTER TABLE shoot_workspace DROP COLUMN selection_confirmed_at;
ALTER TABLE packages DROP COLUMN retouch_count;
CREATE TRIGGER stamp_package_update AFTER UPDATE OF name,price_krw,original_price_krw,shoot_duration_minutes,outfits,description,is_active ON packages BEGIN
 UPDATE packages SET updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=NEW.id;
END;
CREATE TRIGGER booking_snapshot_insert AFTER INSERT ON shoots BEGIN
 INSERT INTO orders(id,customer_id,package_id,package_name,package_price_krw,shoot_duration_minutes,total_amount_krw,created_at,updated_at)
 SELECT * FROM legacy_order_snapshots WHERE id=NEW.id;
 INSERT INTO bookings VALUES(NEW.id,NEW.id,NEW.created_at,NEW.created_at);
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.director_id,'director',NEW.created_at WHERE NEW.director_id IS NOT NULL;
END;
CREATE TRIGGER booking_staff_director_update AFTER UPDATE OF director_id ON shoots WHEN OLD.director_id IS NOT NEW.director_id BEGIN
 UPDATE booking_staff SET released_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE booking_id=NEW.id AND role='director' AND released_at IS NULL;
 INSERT INTO booking_staff(booking_id,staff_id,role,assigned_at) SELECT NEW.id,NEW.director_id,'director',strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE NEW.director_id IS NOT NULL;
END;

DROP INDEX one_active_shoot_per_customer;
CREATE UNIQUE INDEX one_active_shoot_per_customer ON shoots(customer_id) WHERE status NOT IN
 ('cancelled','shoot_complete','delivered','review_requested','review_pending','review_confirmed','originals_pending','originals_delivered','follow_up');
UPDATE shoots SET status='shoot_complete' WHERE status IN ('selection_pending','selection_complete','retouch_assigned','retouching');
UPDATE booking_events SET from_status='shoot_complete' WHERE from_status IN ('selection_pending','selection_complete','retouch_assigned','retouching');
UPDATE booking_events SET to_status='shoot_complete' WHERE to_status IN ('selection_pending','selection_complete','retouch_assigned','retouching');
UPDATE shoots SET package_snapshot=json_remove(package_snapshot,'$.retouchCount') WHERE json_valid(package_snapshot) AND json_type(package_snapshot,'$.retouchCount') IS NOT NULL;
UPDATE booking_surveys SET answers_json=json_remove(answers_json,'$.retouchStrength','$.selector')
WHERE json_valid(answers_json) AND (json_type(answers_json,'$.retouchStrength') IS NOT NULL OR json_type(answers_json,'$.selector') IS NOT NULL);
UPDATE customers SET name='데모 고객 · 촬영 완료' WHERE id='demo-customer-3' AND name='데모 고객 · 셀렉';

-- 판매가 끝난 항목의 기존 주문 금액·명칭은 주문 내역에 남깁니다.
DELETE FROM package_items WHERE item_id='extra_retouch';
DELETE FROM director_item_skills WHERE item_id='extra_retouch';
DELETE FROM items WHERE id='extra_retouch' AND NOT EXISTS(SELECT 1 FROM order_items WHERE item_id=items.id) AND NOT EXISTS(SELECT 1 FROM shoot_addons WHERE addon_id=items.id);
ALTER TABLE items ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0 CHECK(is_archived IN (0,1) AND (is_archived=0 OR active=0));
UPDATE items SET active=0,is_archived=1 WHERE id='extra_retouch';
UPDATE settings SET value_json=json_remove(value_json,'$.addons.extra_retouch') WHERE key='catalog_rules' AND json_valid(value_json);
CREATE TRIGGER item_default_packages AFTER INSERT ON items BEGIN
 INSERT INTO package_items SELECT id,NEW.id,'optional',MAX(CASE WHEN id='allday' AND NEW.id='shopping' THEN 2 ELSE 1 END,NEW.max_quantity) FROM packages;
END;
CREATE TRIGGER package_default_items AFTER INSERT ON packages BEGIN
 INSERT INTO package_items SELECT NEW.id,id,'optional',MAX(CASE WHEN NEW.id='allday' AND id='shopping' THEN 2 ELSE 1 END,max_quantity) FROM items WHERE active=1;
END;

UPDATE booking_notices SET template_key=NULL WHERE template_key='11-selection';
UPDATE staff_notifications SET template_key=NULL WHERE template_key='11-selection';
DELETE FROM template_settings WHERE template_key='11-selection';
DELETE FROM message_templates WHERE key='11-selection';
UPDATE message_templates SET title='촬영 결과물 전달 안내',body='{고객명}님, 네이버 클라우드로 촬영 결과물을 전달드렸습니다.' WHERE key='12-delivery' AND title='보정 · 전달 안내';
UPDATE message_templates SET body='{고객명}님, 촬영 후기를 남겨주세요.' WHERE key='13-review' AND body LIKE '%원본이 공개됩니다.%';
UPDATE message_templates SET body='{고객명}님, 안내받은 네이버 클라우드 링크에서 촬영 원본을 확인해주세요.' WHERE key='14-originals' AND body LIKE '%공개된 원본%';

-- 사라진 직무의 세션을 회수하고, 작성자나 예약 담당자로 남은 기록은 비활성 직원으로 보존합니다.
CREATE TABLE migration_0020_retired(id TEXT PRIMARY KEY);
INSERT INTO migration_0020_retired SELECT id FROM staff WHERE role='retoucher' OR id='demo-director-styling';
DELETE FROM staff_login_tokens WHERE staff_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM sessions WHERE staff_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM director_package_skills WHERE director_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM director_item_skills WHERE director_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM director_availability WHERE director_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM director_days_off WHERE director_id IN (SELECT id FROM migration_0020_retired);
DELETE FROM staff_notifications WHERE staff_id IN (SELECT id FROM migration_0020_retired) AND status IN ('pending','cancelled');
UPDATE staff SET active=0,username=NULL,password_hash=NULL,auth_version=auth_version+1,
 role=CASE WHEN role='retoucher' THEN 'staff' ELSE role END
 WHERE id IN (SELECT id FROM migration_0020_retired);
DELETE FROM staff WHERE id IN (SELECT id FROM migration_0020_retired)
 AND NOT EXISTS(SELECT 1 FROM bookings b JOIN shoots s ON s.id=b.id WHERE s.director_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM slots WHERE director_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM booking_staff WHERE staff_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM payments WHERE confirmed_by=staff.id)
 AND NOT EXISTS(SELECT 1 FROM requests WHERE handled_by=staff.id)
 AND NOT EXISTS(SELECT 1 FROM booking_notes WHERE author_staff_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM settings_history WHERE actor_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM booking_confirmations WHERE confirmed_by_staff_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM booking_tasks WHERE assigned_to_staff_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM staff_notifications WHERE staff_id=staff.id)
 AND NOT EXISTS(SELECT 1 FROM booking_photos WHERE uploaded_by_staff_id=staff.id);
DROP TABLE migration_0020_retired;

-- 대표가 이미 지정된 DB에서는 이전의 일반 관리자 권한도 회수합니다.
UPDATE staff SET role='staff',auth_version=auth_version+1
 WHERE role='admin' AND is_ceo=0 AND EXISTS(SELECT 1 FROM staff WHERE is_ceo=1);
CREATE TABLE migration_0020_ceo(id TEXT PRIMARY KEY);
INSERT INTO migration_0020_ceo SELECT id FROM staff WHERE is_ceo=1;
DROP INDEX staff_single_ceo;
DROP TRIGGER enforce_internal_photo;
ALTER TABLE staff ADD COLUMN new_role TEXT NOT NULL DEFAULT 'staff' CHECK(new_role IN ('admin','staff','director'));
UPDATE staff SET new_role=role;
ALTER TABLE staff DROP COLUMN is_ceo;
ALTER TABLE staff DROP COLUMN role;
ALTER TABLE staff RENAME COLUMN new_role TO role;
ALTER TABLE staff ADD COLUMN is_ceo INTEGER NOT NULL DEFAULT 0 CHECK(is_ceo IN (0,1) AND (is_ceo=0 OR role='admin'));
UPDATE staff SET is_ceo=1 WHERE id IN (SELECT id FROM migration_0020_ceo);
DROP TABLE migration_0020_ceo;
CREATE UNIQUE INDEX staff_single_ceo ON staff(is_ceo) WHERE is_ceo=1;
CREATE TRIGGER enforce_internal_photo BEFORE INSERT ON uploads WHEN NEW.kind='internal_photo' AND
 (NEW.visible!=0 OR NOT EXISTS(SELECT 1 FROM staff WHERE id=NEW.uploaded_by AND active=1 AND role IN ('admin','staff','director')))
 BEGIN SELECT RAISE(ABORT,'internal photo access'); END;
