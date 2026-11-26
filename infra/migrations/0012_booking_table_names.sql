-- 업무 이름을 실제 저장 테이블에 적용하고 이전 조회·시드에는 호환 뷰를 제공합니다.

DROP VIEW items;
ALTER TABLE addons RENAME TO items;
ALTER TABLE items RENAME COLUMN price TO unit_price_krw;
CREATE VIEW addons AS SELECT id,name,unit_price_krw AS price,description,max_quantity,active FROM items;
CREATE TRIGGER legacy_addons_insert INSTEAD OF INSERT ON addons BEGIN
 INSERT INTO items(id,name,unit_price_krw,description,max_quantity,active) VALUES(NEW.id,NEW.name,NEW.price,NEW.description,COALESCE(NEW.max_quantity,1),COALESCE(NEW.active,1));
END;
CREATE TRIGGER legacy_addons_update INSTEAD OF UPDATE ON addons BEGIN
 UPDATE items SET id=NEW.id,name=NEW.name,unit_price_krw=NEW.price,description=NEW.description,max_quantity=NEW.max_quantity,active=NEW.active WHERE id=OLD.id;
END;
CREATE TRIGGER legacy_addons_delete INSTEAD OF DELETE ON addons BEGIN
 DELETE FROM items WHERE id=OLD.id;
END;

DROP VIEW director_item_skills;
ALTER TABLE director_skills RENAME TO director_item_skills;
ALTER TABLE director_item_skills RENAME COLUMN addon_id TO item_id;
CREATE VIEW director_skills AS SELECT director_id,item_id AS addon_id FROM director_item_skills;
CREATE TRIGGER legacy_director_skills_insert INSTEAD OF INSERT ON director_skills BEGIN
 INSERT INTO director_item_skills(director_id,item_id) VALUES(NEW.director_id,NEW.addon_id);
END;
CREATE TRIGGER legacy_director_skills_update INSTEAD OF UPDATE ON director_skills BEGIN
 UPDATE director_item_skills SET director_id=NEW.director_id,item_id=NEW.addon_id WHERE director_id=OLD.director_id AND item_id=OLD.addon_id;
END;
CREATE TRIGGER legacy_director_skills_delete INSTEAD OF DELETE ON director_skills BEGIN
 DELETE FROM director_item_skills WHERE director_id=OLD.director_id AND item_id=OLD.addon_id;
END;

DROP VIEW booking_surveys;
ALTER TABLE surveys RENAME TO booking_surveys;
ALTER TABLE booking_surveys RENAME COLUMN shoot_id TO booking_id;
CREATE VIEW surveys AS SELECT booking_id AS shoot_id,answers_json,page_done_json,submitted_at,updated_at FROM booking_surveys;
CREATE TRIGGER legacy_surveys_insert INSTEAD OF INSERT ON surveys BEGIN
 INSERT INTO booking_surveys(booking_id,answers_json,page_done_json,submitted_at,updated_at) VALUES(NEW.shoot_id,COALESCE(NEW.answers_json,'{}'),COALESCE(NEW.page_done_json,'[]'),NEW.submitted_at,COALESCE(NEW.updated_at,CURRENT_TIMESTAMP));
END;
CREATE TRIGGER legacy_surveys_update INSTEAD OF UPDATE ON surveys BEGIN
 UPDATE booking_surveys SET booking_id=NEW.shoot_id,answers_json=NEW.answers_json,page_done_json=NEW.page_done_json,submitted_at=NEW.submitted_at,updated_at=NEW.updated_at WHERE booking_id=OLD.shoot_id;
END;
CREATE TRIGGER legacy_surveys_delete INSTEAD OF DELETE ON surveys BEGIN
 DELETE FROM booking_surveys WHERE booking_id=OLD.shoot_id;
END;

DROP VIEW shoot_briefs;
ALTER TABLE shoot_plans RENAME TO shoot_briefs;
ALTER TABLE shoot_briefs RENAME COLUMN shoot_id TO booking_id;
CREATE VIEW shoot_plans AS SELECT booking_id AS shoot_id,concept,outfits,note,shared_at FROM shoot_briefs;
CREATE TRIGGER legacy_shoot_plans_insert INSTEAD OF INSERT ON shoot_plans BEGIN
 INSERT INTO shoot_briefs(booking_id,concept,outfits,note,shared_at) VALUES(NEW.shoot_id,NEW.concept,NEW.outfits,NEW.note,NEW.shared_at);
END;
CREATE TRIGGER legacy_shoot_plans_update INSTEAD OF UPDATE ON shoot_plans BEGIN
 UPDATE shoot_briefs SET booking_id=NEW.shoot_id,concept=NEW.concept,outfits=NEW.outfits,note=NEW.note,shared_at=NEW.shared_at WHERE booking_id=OLD.shoot_id;
END;
CREATE TRIGGER legacy_shoot_plans_delete INSTEAD OF DELETE ON shoot_plans BEGIN
 DELETE FROM shoot_briefs WHERE booking_id=OLD.shoot_id;
END;

DROP VIEW booking_notes;
ALTER TABLE notes RENAME TO booking_notes;
ALTER TABLE booking_notes RENAME COLUMN shoot_id TO booking_id;
ALTER TABLE booking_notes RENAME COLUMN author_id TO author_staff_id;
CREATE VIEW notes AS SELECT id,booking_id AS shoot_id,text,author_staff_id AS author_id,created_at FROM booking_notes;
CREATE TRIGGER legacy_notes_insert INSTEAD OF INSERT ON notes BEGIN
 INSERT INTO booking_notes(id,booking_id,text,author_staff_id,created_at) VALUES(NEW.id,NEW.shoot_id,NEW.text,NEW.author_id,COALESCE(NEW.created_at,CURRENT_TIMESTAMP));
END;
CREATE TRIGGER legacy_notes_update INSTEAD OF UPDATE ON notes BEGIN
 UPDATE booking_notes SET id=NEW.id,booking_id=NEW.shoot_id,text=NEW.text,author_staff_id=NEW.author_id,created_at=NEW.created_at WHERE id=OLD.id;
END;
CREATE TRIGGER legacy_notes_delete INSTEAD OF DELETE ON notes BEGIN
 DELETE FROM booking_notes WHERE id=OLD.id;
END;

DROP VIEW booking_events;
ALTER TABLE timeline RENAME TO booking_events;
ALTER TABLE booking_events RENAME COLUMN shoot_id TO booking_id;
CREATE VIEW timeline AS SELECT id,booking_id AS shoot_id,from_status,to_status,actor_id,actor_name,reason,created_at FROM booking_events;
CREATE TRIGGER legacy_timeline_insert INSTEAD OF INSERT ON timeline BEGIN
 INSERT INTO booking_events(id,booking_id,from_status,to_status,actor_id,actor_name,reason,created_at) VALUES(NEW.id,NEW.shoot_id,NEW.from_status,NEW.to_status,NEW.actor_id,NEW.actor_name,NEW.reason,COALESCE(NEW.created_at,CURRENT_TIMESTAMP));
END;
CREATE TRIGGER legacy_timeline_update INSTEAD OF UPDATE ON timeline BEGIN
 UPDATE booking_events SET id=NEW.id,booking_id=NEW.shoot_id,from_status=NEW.from_status,to_status=NEW.to_status,actor_id=NEW.actor_id,actor_name=NEW.actor_name,reason=NEW.reason,created_at=NEW.created_at WHERE id=OLD.id;
END;
CREATE TRIGGER legacy_timeline_delete INSTEAD OF DELETE ON timeline BEGIN
 DELETE FROM booking_events WHERE id=OLD.id;
END;

DROP VIEW booking_photos;
CREATE TABLE booking_photos (
 id TEXT PRIMARY KEY NOT NULL REFERENCES uploads(id), booking_id TEXT NOT NULL REFERENCES bookings(id),
 object_key TEXT NOT NULL UNIQUE, original_filename TEXT NOT NULL, mime_type TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes>0), uploaded_by_staff_id TEXT NOT NULL REFERENCES staff(id), uploaded_at TEXT NOT NULL
);
INSERT INTO booking_photos SELECT id,shoot_id,object_key,name,content_type,size,uploaded_by,created_at FROM uploads WHERE kind='internal_photo';
CREATE TRIGGER store_internal_photo AFTER INSERT ON uploads WHEN NEW.kind='internal_photo' BEGIN
 INSERT INTO booking_photos VALUES(NEW.id,NEW.shoot_id,NEW.object_key,NEW.name,NEW.content_type,NEW.size,NEW.uploaded_by,NEW.created_at);
END;
CREATE INDEX booking_photos_by_booking ON booking_photos(booking_id,uploaded_at);
