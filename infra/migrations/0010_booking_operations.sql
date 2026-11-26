-- 기존 예약에 연결된 자료를 유지하면서 카탈로그 구성, 고객 계정과 운영 기록을 추가합니다.
CREATE VIEW items AS SELECT id,name,price AS unit_price_krw,description,max_quantity,active FROM addons;
CREATE VIEW director_item_skills AS SELECT director_id,addon_id AS item_id FROM director_skills;
CREATE TABLE package_items (
 package_id TEXT NOT NULL REFERENCES packages(id),
 item_id TEXT NOT NULL REFERENCES addons(id),
 inclusion_type TEXT NOT NULL CHECK(inclusion_type IN ('included','optional')),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 PRIMARY KEY(package_id,item_id)
);
INSERT INTO package_items SELECT p.id,a.id,'optional',MAX(CASE WHEN p.id='allday' AND a.id='shopping' THEN 2 ELSE 1 END,a.max_quantity) FROM packages p CROSS JOIN addons a WHERE a.id!='extra_retouch';
CREATE TRIGGER package_default_items AFTER INSERT ON packages BEGIN
 INSERT INTO package_items SELECT NEW.id,id,'optional',MAX(CASE WHEN NEW.id='allday' AND id='shopping' THEN 2 ELSE 1 END,max_quantity) FROM addons WHERE id!='extra_retouch';
END;
CREATE TRIGGER item_default_packages AFTER INSERT ON addons WHEN NEW.id!='extra_retouch' BEGIN
 INSERT INTO package_items SELECT id,NEW.id,'optional',MAX(CASE WHEN id='allday' AND NEW.id='shopping' THEN 2 ELSE 1 END,NEW.max_quantity) FROM packages;
END;

CREATE TABLE customer_social_accounts (
 id TEXT NOT NULL PRIMARY KEY,
 customer_id TEXT NOT NULL REFERENCES customers(id),
 provider TEXT NOT NULL CHECK(provider IN ('kakao','google')),
 provider_subject TEXT NOT NULL CHECK(length(provider_subject)>0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(provider,provider_subject), UNIQUE(customer_id,provider)
);
CREATE TABLE customer_auth_states (
 state_hash TEXT PRIMARY KEY NOT NULL,
 session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
 booking_id TEXT NOT NULL REFERENCES bookings(id),
 provider TEXT NOT NULL CHECK(provider IN ('kakao','google')),
 expires_at TEXT NOT NULL
);
CREATE INDEX customer_auth_expiry ON customer_auth_states(expires_at);
ALTER TABLE sessions ADD COLUMN social_verified INTEGER NOT NULL DEFAULT 0 CHECK(social_verified IN (0,1));
CREATE VIEW booking_surveys AS SELECT shoot_id AS booking_id,answers_json,page_done_json,submitted_at,updated_at FROM surveys;
CREATE VIEW shoot_briefs AS SELECT shoot_id AS booking_id,concept,outfits,note,shared_at FROM shoot_plans;
CREATE VIEW booking_notes AS SELECT id,shoot_id AS booking_id,text,author_id AS author_staff_id,created_at FROM notes;
CREATE VIEW booking_events AS SELECT id,shoot_id AS booking_id,from_status,to_status,actor_id,actor_name,reason,created_at FROM timeline;
CREATE VIEW booking_photos AS SELECT id,shoot_id AS booking_id,object_key,name AS original_filename,
 content_type AS mime_type,size AS size_bytes,uploaded_by AS uploaded_by_staff_id,created_at AS uploaded_at FROM uploads WHERE kind='internal_photo';
CREATE TRIGGER enforce_internal_photo BEFORE INSERT ON uploads WHEN NEW.kind='internal_photo' AND
 (NEW.visible!=0 OR NOT EXISTS(SELECT 1 FROM staff WHERE id=NEW.uploaded_by AND active=1 AND role IN ('admin','staff','director')))
 BEGIN SELECT RAISE(ABORT,'internal photo access'); END;
CREATE TRIGGER keep_internal_photo_private BEFORE UPDATE OF visible,kind ON uploads WHEN
 (NEW.kind='internal_photo' AND NEW.visible!=0) OR (OLD.kind='internal_photo' AND NEW.kind!='internal_photo')
 BEGIN SELECT RAISE(ABORT,'internal photo access'); END;

CREATE TABLE booking_tasks (
 id TEXT PRIMARY KEY NOT NULL, booking_id TEXT NOT NULL REFERENCES bookings(id),
 title TEXT NOT NULL CHECK(length(trim(title))>0), assigned_to_staff_id TEXT REFERENCES staff(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT
);
CREATE INDEX booking_tasks_by_booking ON booking_tasks(booking_id,completed_at);
DROP INDEX one_active_shoot_per_customer;
CREATE UNIQUE INDEX one_active_shoot_per_customer ON shoots(customer_id) WHERE status NOT IN ('cancelled','follow_up','shoot_complete');
CREATE TABLE booking_notices (
 id TEXT PRIMARY KEY NOT NULL, booking_id TEXT NOT NULL REFERENCES bookings(id),
 template_key TEXT REFERENCES message_templates(key), body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX booking_notices_by_booking ON booking_notices(booking_id,created_at);
CREATE TRIGGER save_manual_notice AFTER INSERT ON notifications WHEN NEW.kind LIKE 'template:%' AND NEW.state='manually_confirmed' BEGIN
 INSERT INTO booking_notices(id,booking_id,template_key,body) VALUES(NEW.id,NEW.shoot_id,substr(NEW.kind,10),NEW.body);
END;
CREATE TRIGGER confirmation_notice_insert AFTER INSERT ON booking_confirmations BEGIN
 INSERT INTO booking_notices(id,booking_id,body) SELECT lower(hex(randomblob(16))),NEW.booking_id,'촬영 일정 확정 · '||o.starts_at||' · '||NEW.location FROM booking_time_options o WHERE o.id=NEW.option_id;
END;
CREATE TRIGGER confirmation_notice_update AFTER UPDATE OF option_id,location ON booking_confirmations
 WHEN NEW.option_id!=OLD.option_id OR NEW.location!=OLD.location BEGIN
 INSERT INTO booking_notices(id,booking_id,body) SELECT lower(hex(randomblob(16))),NEW.booking_id,'촬영 일정 변경 · '||o.starts_at||' · '||NEW.location FROM booking_time_options o WHERE o.id=NEW.option_id;
END;
CREATE TABLE staff_notifications (
 id TEXT PRIMARY KEY NOT NULL, booking_id TEXT NOT NULL REFERENCES bookings(id), event_id TEXT REFERENCES timeline(id),
 staff_id TEXT NOT NULL REFERENCES staff(id), template_key TEXT REFERENCES message_templates(key),
 kind TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','cancelled')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at TEXT, UNIQUE(event_id,staff_id,kind)
);
CREATE INDEX staff_notifications_inbox ON staff_notifications(staff_id,status,created_at);
CREATE TRIGGER notify_assigned_staff AFTER INSERT ON booking_staff WHEN NEW.released_at IS NULL BEGIN
 INSERT INTO staff_notifications(id,booking_id,staff_id,kind,body) VALUES(lower(hex(randomblob(16))),NEW.booking_id,NEW.staff_id,'assignment','새 촬영이 배정되었습니다.');
END;
CREATE TRIGGER cancel_staff_notification AFTER UPDATE OF released_at ON booking_staff WHEN NEW.released_at IS NOT NULL BEGIN
 UPDATE staff_notifications SET status='cancelled' WHERE booking_id=NEW.booking_id AND staff_id=NEW.staff_id AND status='pending' AND NOT EXISTS(SELECT 1 FROM booking_staff WHERE booking_id=NEW.booking_id AND staff_id=NEW.staff_id AND released_at IS NULL);
END;
CREATE TRIGGER notify_confirmed_schedule AFTER INSERT ON timeline WHEN NEW.reason='담당 디렉터가 촬영 일시와 장소 확정' BEGIN
 INSERT INTO staff_notifications(id,booking_id,event_id,staff_id,kind,body)
 SELECT lower(hex(randomblob(16))),NEW.shoot_id,NEW.id,s.staff_id,'schedule_confirmed','담당 촬영 일정이 확정되었습니다.'
 FROM (SELECT DISTINCT staff_id FROM booking_staff WHERE booking_id=NEW.shoot_id AND released_at IS NULL) s;
END;
CREATE TABLE campaign_entries (
 id TEXT PRIMARY KEY NOT NULL, campaign_id TEXT NOT NULL REFERENCES campaigns(id),booking_id TEXT NOT NULL REFERENCES bookings(id),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(campaign_id,booking_id)
);
INSERT INTO campaign_entries SELECT id,campaign_id,shoot_id,created_at FROM campaign_claims;
CREATE TRIGGER preserve_campaign_entry AFTER INSERT ON campaign_claims BEGIN
 INSERT OR IGNORE INTO campaign_entries(id,campaign_id,booking_id,created_at) VALUES(NEW.id,NEW.campaign_id,NEW.shoot_id,NEW.created_at);
END;
CREATE TABLE analytics_events (
 id TEXT PRIMARY KEY NOT NULL, event_name TEXT NOT NULL, visitor_id TEXT, booking_id TEXT REFERENCES bookings(id),
 sales_channel TEXT, device_type TEXT, section TEXT, duration_ms INTEGER CHECK(duration_ms>=0), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX analytics_funnel ON analytics_events(event_name,sales_channel,created_at);
CREATE TRIGGER analytics_order_completed AFTER INSERT ON booking_time_options
 WHEN NOT EXISTS(SELECT 1 FROM analytics_events WHERE booking_id=NEW.booking_id AND event_name='order_completed') BEGIN
 INSERT INTO analytics_events(id,event_name,booking_id,sales_channel) SELECT lower(hex(randomblob(16))),'order_completed',NEW.booking_id,o.sales_channel FROM bookings b JOIN orders o ON o.id=b.order_id WHERE b.id=NEW.booking_id;
END;
CREATE TRIGGER analytics_survey_saved AFTER UPDATE ON surveys BEGIN
 INSERT INTO analytics_events(id,event_name,booking_id)
 SELECT lower(hex(randomblob(16))),'survey_started',NEW.shoot_id WHERE NOT EXISTS(SELECT 1 FROM analytics_events WHERE event_name='survey_started' AND booking_id=NEW.shoot_id);
 INSERT INTO analytics_events(id,event_name,booking_id)
 SELECT lower(hex(randomblob(16))),'survey_submitted',NEW.shoot_id WHERE OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL;
END;
