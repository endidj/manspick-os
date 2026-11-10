-- 원본의 수동 안내 목록을 추가하고 기존 운영자가 저장한 템플릿은 보존합니다.
ALTER TABLE template_settings ADD COLUMN rules_json TEXT;
CREATE UNIQUE INDEX one_confirmed_template ON notifications(shoot_id,kind) WHERE substr(kind,1,9)='template:' AND state='manually_confirmed';

-- I-7에서 본문이 보이는 준비물 안내 외 문구는 운영자 확인 전 비활성 초안입니다.
INSERT OR IGNORE INTO message_templates(key,title,body,auto) VALUES
('01-os-link','OS 링크 안내','{고객명}님, 나의 촬영 안내를 확인해주세요.
{OS링크}',0),
('02-survey','설문 작성 안내','{고객명}님, 촬영 준비를 위한 설문을 작성해주세요.
{OS링크}',0),
('03-survey-reminder','설문 리마인드','{고객명}님, 아직 작성하지 않은 설문을 확인해주세요.
{OS링크}',0),
('04-schedule','일정 선택 안내','{고객명}님, 촬영 가능한 일정을 선택해주세요.
{OS링크}',0),
('05-confirmation','촬영 확정 안내','{고객명}님, {촬영일} {촬영시간} 촬영 일정을 확인해주세요.
담당 디렉터 {디렉터}
{OS링크}',0),
('06-preparation','준비물 · 의상','{고객명}님, {촬영일} 촬영 준비 안내드려요 :)

👔 의상 {의상벌수}벌 준비해주세요. 셔츠·니트처럼 단색 위주가 좋아요.
👟 신발은 깨끗한 단색 스니커즈나 로퍼를 추천드려요.
💈 {부가서비스}

자세한 준비 체크리스트는 여기서 확인하실 수 있어요 → {OS링크}',0),
('07-hair','부가서비스 · 헤어','{고객명}님, 선택하신 부가서비스 안내를 확인해주세요.
{부가서비스}
{OS링크}',0),
('08-location','장소 · 주차','{고객명}님, 촬영 장소와 주차 안내를 확인해주세요.
{장소}
{OS링크}',0),
('09-cancellation','변경 · 취소 규정','{고객명}님, 일정 변경·취소 규정을 준비 안내에서 확인해주세요.
{OS링크}',0),
('10-day-before','D-1 리마인드','{고객명}님, 내일 {촬영시간} 촬영 안내를 확인해주세요.
{장소}
{OS링크}',0),
('11-selection','셀렉 안내','{고객명}님, 후보 사진에서 보정받을 사진을 골라주세요.
{OS링크}',0),
('12-delivery','보정 · 전달 안내','{고객명}님, 보정 결과를 확인해주세요.
{OS링크}',0),
('13-review','후기 요청','{고객명}님, 후기를 남기고 캡처를 제출해주세요. 운영자 확인 후 원본이 공개됩니다.
{OS링크}',0),
('14-originals','원본 제공 안내','{고객명}님, 나의 촬영에서 공개된 원본을 확인해주세요.
{OS링크}',0),
('15-referral','지인소개 이벤트','운영자 확인이 필요한 지인소개 이벤트 안내 초안입니다.',0);

INSERT OR IGNORE INTO template_settings(template_key,active,condition_text,rules_json)
SELECT key,CASE WHEN key='06-preparation' THEN 1 ELSE 0 END,
CASE WHEN key='06-preparation' THEN '4 · 촬영 준비' ELSE '운영 문구 확인 전 비활성 초안' END,
json_object('stages',json(CASE WHEN key LIKE '01-%' THEN '[1]' WHEN key IN ('02-survey','03-survey-reminder') THEN '[3]' WHEN key='04-schedule' THEN '[2]' WHEN key IN ('11-selection','12-delivery') THEN '[6]' WHEN key IN ('13-review','14-originals','15-referral') THEN '[7]' ELSE '[4]' END),'packageIds',json('[]'),'addonIds',json('[]'),'roles',json('["admin","staff","director"]'))
FROM message_templates WHERE key IN ('01-os-link','02-survey','03-survey-reminder','04-schedule','05-confirmation','06-preparation','07-hair','08-location','09-cancellation','10-day-before','11-selection','12-delivery','13-review','14-originals','15-referral');

