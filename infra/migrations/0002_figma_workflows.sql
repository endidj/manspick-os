-- 기존 촬영과 파일은 유지하고 준비·현장·외부 링크·동의 기록을 추가합니다.
CREATE TABLE shoot_workspace (
 shoot_id TEXT PRIMARY KEY REFERENCES shoots(id),
 preparation_json TEXT,
 preparation_confirmed_at TEXT,
 selection_confirmed_at TEXT,
 selection_reason TEXT NOT NULL DEFAULT '',
 field_memo TEXT NOT NULL DEFAULT '',
 profile_json TEXT
);
CREATE TABLE external_file_links (
 id TEXT PRIMARY KEY,
 shoot_id TEXT NOT NULL REFERENCES shoots(id),
 kind TEXT NOT NULL CHECK(kind IN ('retouched','original')),
 label TEXT NOT NULL,
 url TEXT NOT NULL,
 visible INTEGER NOT NULL DEFAULT 0 CHECK(visible IN (0,1)),
 published_at TEXT,
 UNIQUE(shoot_id,kind)
);
CREATE TABLE template_settings (
 template_key TEXT PRIMARY KEY REFERENCES message_templates(key),
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 condition_text TEXT NOT NULL DEFAULT ''
);
CREATE TABLE settings_history (
 id TEXT PRIMARY KEY,
 actor_id TEXT NOT NULL REFERENCES staff(id),
 setting_key TEXT NOT NULL,
 previous_json TEXT,
 next_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
