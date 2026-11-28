-- 고객 진입 화면의 가상 예약 두 건을 추가합니다. 기존 입력과 재발급된 링크는 보존합니다.
INSERT INTO customers(id,name,phone) VALUES
 ('demo-page-survey-customer','정test','01000011001'),
 ('demo-page-prep-customer','강test','01000011002')
ON CONFLICT(id) DO NOTHING;

WITH samples(id,token_hash,status,package_id) AS (VALUES
 ('demo-page-survey','6d3f8e534761396b479ce5853b695752d6e042422c8c1c19e4f18ee7032b0cf0','survey_pending','one'),
 ('demo-page-prep','121077c14a03e40ccd5871e4442d1e0bc71eb01bc9080ee694fb5ae11f12f332','preparing','hybrid'))
INSERT INTO shoots(id,customer_id,access_token_hash,status,package_id,package_snapshot,total_amount,director_id,starts_at,ends_at)
SELECT s.id,s.id||'-customer',s.token_hash,s.status,p.id,
 json_object('id',p.id,'name',p.name,'price',p.price_krw,'originalPrice',p.original_price_krw,
             'duration',p.shoot_duration_minutes,'outfits',p.outfits,'description',p.description),
 p.price_krw,'demo-director',
 CASE WHEN s.status='preparing' THEN strftime('%Y-%m-%dT02:00:00.000Z','now','+14 days') END,
 CASE WHEN s.status='preparing' THEN strftime('%Y-%m-%dT%H:%M:%fZ',date('now','+14 days'),'2 hours',p.shoot_duration_minutes||' minutes') END
FROM samples s JOIN packages p ON p.id=s.package_id WHERE 1
ON CONFLICT(id) DO NOTHING;

INSERT INTO payments(id,shoot_id,kind,channel,amount,state,confirmed_at,provider,provider_transaction_id)
SELECT id||'-payment',id,'base','pg',total_amount,'confirmed',created_at,'test_checkout',id||'-checkout'
FROM shoots WHERE id IN ('demo-page-survey','demo-page-prep')
ON CONFLICT(id) DO NOTHING;

INSERT INTO booking_surveys(booking_id,answers_json,page_done_json,submitted_at) VALUES
 ('demo-page-survey','{}','[]',NULL),
 ('demo-page-prep','{"firstImpression":5,"age":29,"style":"캐주얼","motivation":"프로필 촬영","purposes":["비즈니스"],"referral":"검색","safetyRead":true}','[1,2,3,4]',strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(booking_id) DO NOTHING;

INSERT INTO booking_time_options(id,booking_id,starts_at)
SELECT id||'-option',id,COALESCE(starts_at,strftime('%Y-%m-%dT04:00:00.000Z',created_at,'+7 days'))
FROM shoots WHERE id IN ('demo-page-survey','demo-page-prep')
ON CONFLICT(id) DO NOTHING;

INSERT INTO booking_confirmations(booking_id,option_id,confirmed_by_staff_id,location,confirmed_at,occupancy_starts_at,occupancy_ends_at)
SELECT id,id||'-option',director_id,'데모 스튜디오 입구',created_at,starts_at,ends_at
FROM shoots WHERE id='demo-page-prep'
ON CONFLICT(booking_id) DO NOTHING;
