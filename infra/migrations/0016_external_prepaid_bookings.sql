-- 플랫폼 닉네임과 희망 일시를 제출한 기존 외부 선결제 예약을 촬영 설문 단계로 연결합니다.
INSERT INTO booking_events(id,booking_id,from_status,to_status,actor_id,actor_name,reason,created_at)
SELECT 'external-prepaid-' || p.id,s.id,'payment_pending','survey_pending','system','시스템',
       '외부 플랫폼 선결제 예약 접수 완료',strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM payments p
JOIN bookings b ON b.id=p.shoot_id AND b.order_id=p.order_id
JOIN orders o ON o.id=b.order_id
JOIN shoots s ON s.id=b.id
WHERE p.kind='base' AND p.state='pending' AND p.channel IN ('kmong','soomgo','frip','smartstore')
  AND s.status='payment_pending' AND s.cancelled_at IS NULL
  AND o.sales_channel=p.channel AND length(trim(o.platform_nickname))>0
  AND p.provider IS NULL AND p.provider_transaction_id IS NULL
  AND EXISTS(SELECT 1 FROM booking_time_options t WHERE t.booking_id=b.id)
  AND NOT EXISTS(SELECT 1 FROM payments other WHERE other.shoot_id=s.id AND other.kind='base' AND other.id!=p.id AND other.state!='released')
  AND NOT EXISTS(SELECT 1 FROM booking_events e WHERE e.id='external-prepaid-' || p.id);

UPDATE payments SET state='confirmed',held_until=NULL,
 confirmed_at=(SELECT e.created_at FROM booking_events e WHERE e.id='external-prepaid-' || payments.id)
WHERE state='pending' AND EXISTS(SELECT 1 FROM booking_events e WHERE e.id='external-prepaid-' || payments.id);

UPDATE requests SET state='complete'
WHERE type='deposit' AND state IN ('new','processing') AND EXISTS(
 SELECT 1 FROM deposit_reports d JOIN booking_events e ON e.id='external-prepaid-' || d.payment_id
 WHERE d.request_id=requests.id
);

UPDATE shoots SET status='survey_pending',version=version+1
WHERE status='payment_pending' AND EXISTS(
 SELECT 1 FROM payments p JOIN booking_events e ON e.id='external-prepaid-' || p.id AND e.booking_id=p.shoot_id
 WHERE p.shoot_id=shoots.id AND p.kind='base' AND p.state='confirmed'
);
