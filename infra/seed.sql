-- LOCAL DEMONSTRATION DATA ONLY. No real people, external messages or payments.
PRAGMA foreign_keys = ON;
INSERT INTO staff(id,name,email,role) VALUES
 ('demo-admin','데모 대표','demo-admin@manspick.co.kr','admin'),
 ('demo-staff','데모 운영 담당','demo-staff@manspick.co.kr','staff'),
 ('demo-director','디렉터1','demo-director@manspick.co.kr','director');
UPDATE staff SET hired_on='2024-01-01' WHERE id='demo-director';
INSERT INTO packages(id,name,price_krw,original_price_krw,shoot_duration_minutes,outfits,description) VALUES
 ('one','원',95000,135000,90,1,'한 벌의 스타일과 자연스러운 첫인상 · iPhone 야외 촬영'),
 ('hybrid','하이브리드',160000,210000,120,2,'두 가지 스타일로 넓히는 나의 이미지'),
 ('allday','올데이',500000,890000,300,4,'스타일링부터 촬영까지 하루를 온전히');
INSERT INTO director_package_skills(director_id,package_id) SELECT 'demo-director',id FROM packages;
INSERT INTO addons(id,name,price,description,max_quantity) VALUES
 ('hair','헤어',70000,'촬영 전 제휴샵 · 디렉터 미동행',1),
 ('rental','의상 대여',25000,'1벌 기준',4),
 ('outfit','1코디 제작',50000,'1코디 기준',4),
 ('shopping','동행 쇼핑',100000,'촬영 두 시간 전 디렉터와 쇼핑',1);
INSERT INTO director_skills(director_id,addon_id) SELECT 'demo-director',id FROM addons;
INSERT INTO campaigns(id,name,amount) VALUES('review-demo','로컬 후기 확인 혜택 · 실제 지급 없음',5000);
INSERT INTO settings(key,value_json) VALUES('local_notice','"로컬 시연입니다. 실제 발송·송금·배포 없음"'),('timezone','"Asia/Seoul"');
INSERT INTO neighborhoods(id,name,meeting_point) VALUES('demo-neighborhood','데모 촬영 동네','실제 장소가 아닌 시연 안내입니다.');
INSERT INTO customers(id,name,phone) VALUES
 ('demo-customer-1','김test','01000001001'),
 ('demo-customer-2','박test','01000001002'),
 ('demo-customer-3','이test','01000001003'),
 ('demo-customer-4','최test','01000001004');
INSERT INTO shoots(id,customer_id,access_token_hash,status,package_id,package_snapshot,total_amount,director_id,starts_at,ends_at,survey_due_at,outfit_due_at) VALUES
 ('demo-payment','demo-customer-1','b2f5dd3cfc19384b83bd56dd2852daa8ae625169ae7f5fae61f7fc94b661d362','payment_pending','one','{"id":"one","name":"원","price":95000,"originalPrice":135000,"duration":90,"outfits":1,"description":"한 벌의 스타일과 자연스러운 첫인상"}',95000,'demo-director',strftime('%Y-%m-%dT04:00:00.000Z','now','+3 days'),strftime('%Y-%m-%dT05:30:00.000Z','now','+3 days'),strftime('%Y-%m-%dT11:00:00.000Z','now'),strftime('%Y-%m-%dT11:00:00.000Z','now','+1 day')),
 ('demo-preparation','demo-customer-2','2dd3de591dc4261d584ab0f0ee9422dfa837821ed0350322a2cbf68a4e3956d3','preparing','hybrid','{"id":"hybrid","name":"하이브리드","price":160000,"originalPrice":210000,"duration":120,"outfits":2,"description":"두 가지 스타일의 이미지"}',185000,'demo-director',strftime('%Y-%m-%dT04:00:00.000Z','now','+5 days'),strftime('%Y-%m-%dT06:00:00.000Z','now','+5 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+2 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+3 days')),
 ('demo-selection','demo-customer-3','91ef7c57197628c54ecf860649cc567de0f7f69ae12e1e1b7f62c0e670f51d68','shoot_complete','hybrid','{"id":"hybrid","name":"하이브리드","price":160000,"originalPrice":210000,"duration":120,"outfits":2,"description":"두 가지 스타일의 이미지"}',160000,'demo-director',strftime('%Y-%m-%dT04:00:00.000Z','now','+7 days'),strftime('%Y-%m-%dT06:00:00.000Z','now','+7 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+4 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+5 days')),
 ('demo-result','demo-customer-4','9605d11dd380ff0ec346b4dd0c158de8ab85c9b317c17254ec15361cf92791a9','delivered','one','{"id":"one","name":"원","price":95000,"originalPrice":135000,"duration":90,"outfits":1,"description":"한 벌의 스타일과 자연스러운 첫인상"}',95000,'demo-director',strftime('%Y-%m-%dT04:00:00.000Z','now','+9 days'),strftime('%Y-%m-%dT05:30:00.000Z','now','+9 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+6 days'),strftime('%Y-%m-%dT11:00:00.000Z','now','+7 days'));
INSERT INTO shoot_addons(shoot_id,addon_id,name,quantity,unit_price) VALUES('demo-preparation','rental','의상 대여',1,25000);
INSERT INTO slots(id,director_id,date,time,shoot_id) SELECT 'slot-'||id,'demo-director',substr(starts_at,1,10),'13:00',id FROM shoots;
INSERT INTO payments(id,shoot_id,kind,channel,amount,state,held_until,confirmed_at,confirmed_by) VALUES
 ('demo-payment-base','demo-payment','base','bank',95000,'pending',strftime('%Y-%m-%dT%H:%M:%fZ','now','+20 hours'),NULL,NULL),
 ('demo-preparation-base','demo-preparation','base','bank',185000,'confirmed',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'demo-staff'),
 ('demo-selection-base','demo-selection','base','bank',160000,'confirmed',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'demo-staff'),
 ('demo-result-base','demo-result','base','bank',95000,'confirmed',NULL,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'demo-staff');
INSERT INTO surveys(shoot_id,answers_json,page_done_json,submitted_at) VALUES
 ('demo-payment','{}','[]',NULL),
 ('demo-preparation','{"age":29,"occupation":"데모 직업","style":"캐주얼","purposes":["비즈니스"],"marketingConsent":false}','[1,2,3,4]',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('demo-selection','{}','[1,2,3,4]',strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('demo-result','{}','[1,2,3,4]',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
INSERT INTO shoot_plans(shoot_id,concept,outfits,note,shared_at) VALUES('demo-preparation','편안하지만 선명한 첫인상','네이비 재킷 + 밝은 이너 / 자연스러운 캐주얼','고객 준비 의상 사진 한 장을 올려주세요. 실제 장소·일정이 아닌 데모 안내입니다.',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i+1 FROM n WHERE i<8)
INSERT INTO uploads(id,shoot_id,kind,object_key,name,content_type,size,visible,uploaded_by) SELECT 'demo-selection-upload-'||i,'demo-selection','internal_photo','demo/selection/'||i,'촬영 사진 '||i,'image/svg+xml',1000,0,'demo-director' FROM n;
INSERT INTO notes(id,shoot_id,text,author_id) VALUES('demo-note','demo-preparation','이 메모는 직원에게만 보입니다. 실제 고객 기록이 아닌 시연 데이터입니다.','demo-staff');
INSERT INTO timeline(id,shoot_id,to_status,actor_id,actor_name,reason) SELECT 'demo-timeline-'||id,id,status,'demo-staff','데모 운영 담당','로컬 시연 상태 생성 · 실제 업무 진행 이력 아님' FROM shoots;
INSERT INTO notifications(id,shoot_id,kind,body,send_at) VALUES('demo-outbox','demo-payment','booking','로컬 대기 알림입니다. 실제 고객·이메일·알림톡으로 발송되지 않습니다.',strftime('%Y-%m-%dT%H:%M:%fZ','now'));
