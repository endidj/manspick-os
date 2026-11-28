-- 기존 시연용 고객과 디렉터의 기본 이름을 새 표기와 맞춥니다.
UPDATE customers SET name='김test'
 WHERE id='demo-customer-1' AND name IN ('데모 고객 · 예약','김테스트');
UPDATE customers SET name='박test'
 WHERE id='demo-customer-2' AND name IN ('데모 고객 · 준비','박테스트');
UPDATE customers SET name='이test'
 WHERE id='demo-customer-3' AND name IN ('데모 고객 · 셀렉','데모 고객 · 촬영 완료','이테스트');
UPDATE customers SET name='최test'
 WHERE id='demo-customer-4' AND name IN ('데모 고객 · 결과','최테스트');
UPDATE customers SET name='정test'
 WHERE id='demo-page-survey-customer' AND name IN ('체험 고객 · 내 정보','정테스트');
UPDATE customers SET name='강test'
 WHERE id='demo-page-prep-customer' AND name IN ('체험 고객 · 촬영 준비','강테스트');
UPDATE staff SET name='디렉터1'
 WHERE id='demo-director' AND role='director' AND name='데모 디렉터';
