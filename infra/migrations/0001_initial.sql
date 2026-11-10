PRAGMA foreign_keys = ON;

CREATE TABLE staff (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL CHECK(role IN ('admin','staff','director','retoucher')), active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)));
CREATE TABLE packages (id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>=0), original_price INTEGER NOT NULL, duration INTEGER NOT NULL, outfits INTEGER NOT NULL, retouch_count INTEGER NOT NULL, description TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE addons (id TEXT PRIMARY KEY, name TEXT NOT NULL, price INTEGER NOT NULL CHECK(price>=0), description TEXT NOT NULL, max_quantity INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE director_skills (director_id TEXT NOT NULL REFERENCES staff(id), addon_id TEXT NOT NULL REFERENCES addons(id), PRIMARY KEY(director_id,addon_id));
CREATE TABLE retoucher_rules (weekday INTEGER PRIMARY KEY CHECK(weekday BETWEEN 0 AND 6), retoucher_id TEXT NOT NULL REFERENCES staff(id));
CREATE TABLE director_days_off (director_id TEXT NOT NULL REFERENCES staff(id), date TEXT NOT NULL, PRIMARY KEY(director_id,date));
CREATE TABLE neighborhoods (id TEXT PRIMARY KEY, name TEXT NOT NULL, meeting_point TEXT);
CREATE TABLE settings (key TEXT PRIMARY KEY, value_json TEXT NOT NULL);
CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE shoots (
 id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), access_token_hash TEXT NOT NULL UNIQUE,
 token_version INTEGER NOT NULL DEFAULT 1, status TEXT NOT NULL DEFAULT 'payment_pending', package_id TEXT NOT NULL REFERENCES packages(id),
 package_snapshot TEXT NOT NULL, total_amount INTEGER NOT NULL CHECK(total_amount>=0), director_id TEXT REFERENCES staff(id), retoucher_id TEXT REFERENCES staff(id),
 starts_at TEXT, ends_at TEXT, survey_due_at TEXT, outfit_due_at TEXT, select_by TEXT NOT NULL DEFAULT 'customer',
 cancelled_at TEXT, cancelled_reason TEXT, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX one_active_shoot_per_customer ON shoots(customer_id) WHERE status NOT IN ('cancelled','follow_up');
CREATE INDEX shoots_director ON shoots(director_id,status);
CREATE INDEX shoots_retoucher ON shoots(retoucher_id,status);
CREATE TABLE shoot_addons (shoot_id TEXT NOT NULL REFERENCES shoots(id), addon_id TEXT NOT NULL REFERENCES addons(id), name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), unit_price INTEGER NOT NULL, PRIMARY KEY(shoot_id,addon_id));
CREATE TABLE shoot_places (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), neighborhood_id TEXT REFERENCES neighborhoods(id), label TEXT NOT NULL, map_url TEXT, visible INTEGER NOT NULL DEFAULT 0);
CREATE TABLE payments (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), kind TEXT NOT NULL, channel TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>=0), depositor TEXT, state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','confirmed','released')), held_until TEXT, confirmed_at TEXT, confirmed_by TEXT REFERENCES staff(id));
CREATE TABLE slots (id TEXT PRIMARY KEY, director_id TEXT NOT NULL REFERENCES staff(id), date TEXT NOT NULL, time TEXT NOT NULL CHECK(time IN ('11:00','13:00','15:00','17:00')), shoot_id TEXT NOT NULL REFERENCES shoots(id), UNIQUE(director_id,date,time));
CREATE TABLE surveys (shoot_id TEXT PRIMARY KEY REFERENCES shoots(id), answers_json TEXT NOT NULL DEFAULT '{}', page_done_json TEXT NOT NULL DEFAULT '[]', submitted_at TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE uploads (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), kind TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, name TEXT NOT NULL, content_type TEXT NOT NULL, size INTEGER NOT NULL CHECK(size>0), visible INTEGER NOT NULL DEFAULT 0, uploaded_by TEXT NOT NULL, retouch_job_id TEXT REFERENCES retouch_jobs(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE guide_checks (shoot_id TEXT NOT NULL REFERENCES shoots(id), guide_key TEXT NOT NULL, checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(shoot_id,guide_key));
CREATE TABLE access_attempts (token_hash TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, locked_until TEXT, updated_at TEXT NOT NULL);
CREATE TABLE shoot_plans (shoot_id TEXT PRIMARY KEY REFERENCES shoots(id), concept TEXT NOT NULL, outfits TEXT NOT NULL, note TEXT NOT NULL, shared_at TEXT NOT NULL);
CREATE TABLE shoot_sessions (shoot_id TEXT PRIMARY KEY REFERENCES shoots(id), steps_json TEXT NOT NULL DEFAULT '[]', outfit_no INTEGER NOT NULL DEFAULT 1, done_at TEXT);
CREATE TABLE file_links (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), upload_id TEXT REFERENCES uploads(id), version INTEGER NOT NULL DEFAULT 1, visible INTEGER NOT NULL DEFAULT 0);
CREATE TABLE photos (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), upload_id TEXT NOT NULL UNIQUE REFERENCES uploads(id), kind TEXT NOT NULL CHECK(kind IN ('candidate','retouched','revision')), cut_no INTEGER NOT NULL, visible INTEGER NOT NULL DEFAULT 0, uploaded_by TEXT NOT NULL, UNIQUE(shoot_id,kind,cut_no));
CREATE TABLE selections (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), round TEXT NOT NULL CHECK(round IN ('base','extra')), picks_json TEXT NOT NULL, submitted_at TEXT NOT NULL, UNIQUE(shoot_id,round));
CREATE TABLE retouch_jobs (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), retoucher_id TEXT NOT NULL REFERENCES staff(id), kind TEXT NOT NULL, request_id TEXT, state TEXT NOT NULL DEFAULT 'pending', due_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE requests (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), type TEXT NOT NULL CHECK(type IN ('deposit','revision','review','extra_retouch')), state TEXT NOT NULL DEFAULT 'new' CHECK(state IN ('new','processing','complete','rejected')), message TEXT, upload_id TEXT REFERENCES uploads(id), handled_by TEXT REFERENCES staff(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX one_open_request ON requests(shoot_id,type) WHERE state IN ('new','processing');
CREATE TRIGGER maximum_three_revisions BEFORE INSERT ON requests WHEN NEW.type='revision' AND (SELECT COUNT(*) FROM requests WHERE shoot_id=NEW.shoot_id AND type='revision') >= 3 BEGIN SELECT RAISE(ABORT,'REVISION_LIMIT'); END;
CREATE TABLE request_items (id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id), photo_id TEXT NOT NULL REFERENCES photos(id), comment TEXT NOT NULL);
CREATE TRIGGER matching_request_photo BEFORE INSERT ON request_items WHEN (SELECT shoot_id FROM requests WHERE id=NEW.request_id) != (SELECT shoot_id FROM photos WHERE id=NEW.photo_id) BEGIN SELECT RAISE(ABORT,'PHOTO_SCOPE'); END;
CREATE TABLE message_templates (key TEXT PRIMARY KEY, title TEXT NOT NULL, body TEXT NOT NULL, auto INTEGER NOT NULL DEFAULT 0);
CREATE TABLE notifications (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), kind TEXT NOT NULL, body TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'local_pending' CHECK(state IN ('local_pending','cancelled','manually_confirmed')), send_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE timeline (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), from_status TEXT, to_status TEXT, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE notes (id TEXT PRIMARY KEY, shoot_id TEXT NOT NULL REFERENCES shoots(id), text TEXT NOT NULL, author_id TEXT NOT NULL REFERENCES staff(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE campaigns (id TEXT PRIMARY KEY, name TEXT NOT NULL, amount INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE campaign_claims (id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id), shoot_id TEXT NOT NULL REFERENCES shoots(id), request_id TEXT NOT NULL UNIQUE REFERENCES requests(id), state TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(campaign_id,shoot_id));

-- Local implementation infrastructure. These are not additional source business entities.
CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('staff','customer')), staff_id TEXT REFERENCES staff(id), shoot_id TEXT REFERENCES shoots(id), token_version INTEGER, created_at TEXT NOT NULL, expires_at TEXT NOT NULL, CHECK((kind='staff' AND staff_id IS NOT NULL AND shoot_id IS NULL) OR (kind='customer' AND shoot_id IS NOT NULL AND staff_id IS NULL)));
CREATE TABLE rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, resets_at TEXT NOT NULL);
CREATE TABLE mutation_guards (id TEXT PRIMARY KEY, ok INTEGER NOT NULL CHECK(ok=1));
