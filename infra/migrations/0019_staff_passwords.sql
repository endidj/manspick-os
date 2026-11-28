-- 로그인 아이디와 비밀번호 해시, 대표의 계정 관리 권한을 직원 정보에 추가합니다.
ALTER TABLE staff ADD COLUMN username TEXT COLLATE NOCASE;
ALTER TABLE staff ADD COLUMN password_hash TEXT;
ALTER TABLE staff ADD COLUMN is_ceo INTEGER NOT NULL DEFAULT 0
  CHECK(is_ceo IN (0,1) AND (is_ceo=0 OR role='admin'));
CREATE UNIQUE INDEX staff_username ON staff(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX staff_single_ceo ON staff(is_ceo) WHERE is_ceo=1;
