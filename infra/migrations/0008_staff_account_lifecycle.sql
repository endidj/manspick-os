-- 직원 권한이 바뀌면 이미 발급된 세션과 로그인 링크를 함께 회수합니다.
ALTER TABLE staff ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE staff_login_tokens ADD COLUMN auth_version INTEGER NOT NULL DEFAULT 0;
CREATE INDEX sessions_staff ON sessions(staff_id) WHERE kind='staff';
CREATE INDEX staff_login_tokens_staff ON staff_login_tokens(staff_id);
