-- 업로드를 재시도할 때 같은 식별자가 다른 내용에 사용되는 것을 막습니다.
ALTER TABLE uploads ADD COLUMN retry_fingerprint TEXT;
