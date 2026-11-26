-- 고객이 신고한 이름을 수납 레코드와 별도로 보관합니다.
ALTER TABLE deposit_reports ADD COLUMN reported_depositor TEXT;
UPDATE deposit_reports SET reported_depositor=(
 SELECT substr(r.message,length('입금자명: ')+1,length(r.message)-length('입금자명: ')-length(' · 결제 '||deposit_reports.payment_id))
 FROM requests r WHERE r.id=deposit_reports.request_id
 AND substr(r.message,1,length('입금자명: '))='입금자명: '
 AND substr(r.message,-length(' · 결제 '||deposit_reports.payment_id))=' · 결제 '||deposit_reports.payment_id
);
