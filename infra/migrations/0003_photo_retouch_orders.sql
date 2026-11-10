-- 사진의 의상 분류·원본 컷 연결과 수동 입금 확인이 필요한 추가 보정 주문을 저장합니다.
CREATE TABLE photo_metadata (
 photo_id TEXT PRIMARY KEY REFERENCES photos(id),
 outfit_no INTEGER CHECK(outfit_no IS NULL OR outfit_no BETWEEN 1 AND 20),
 outfit_label TEXT,
 parent_photo_id TEXT REFERENCES photos(id)
);
CREATE TABLE retouch_orders (
 payment_id TEXT PRIMARY KEY REFERENCES payments(id),
 request_id TEXT NOT NULL UNIQUE REFERENCES requests(id),
 job_kind TEXT NOT NULL CHECK(job_kind IN ('base','extra')),
 quantity INTEGER NOT NULL CHECK(quantity>0),
 unit_price INTEGER NOT NULL CHECK(unit_price>=0)
);
