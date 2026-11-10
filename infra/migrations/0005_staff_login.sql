-- 직원 이메일의 일회용 로그인 링크를 원문 없이 보관합니다.
CREATE TABLE staff_login_tokens (
  token_hash TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  expires_at TEXT NOT NULL
);
CREATE INDEX staff_login_token_expiration ON staff_login_tokens(expires_at);
CREATE INDEX staff_login_email_lookup ON staff(email COLLATE NOCASE) WHERE active=1;
