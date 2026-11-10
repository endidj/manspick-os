// 촬영의 상태 이름과 순서, 직원 역할을 정의합니다.

export const STATUS_DEFINITIONS = [
  ['new_inquiry', '신규 문의', 1],
  ['options_review', '옵션 확인중', 1],
  ['options_complete', '옵션 선택 완료', 1],
  ['calendar_pending', '캘린더 선택 대기', 2],
  ['calendar_selected', '고객 일정 선택 완료', 2],
  ['director_assigned', '디렉터 자동 배정 완료', 2],
  ['payment_pending', '결제 확인 대기', 2],
  ['booking_confirmed', '촬영일 확정 안내 준비', 2],
  ['survey_pending', '설문 작성 대기', 3],
  ['survey_submitted', '설문 제출 완료', 3],
  ['preparing', '촬영 준비중', 4],
  ['reminder_ready', '전날 리마인드 준비', 4],
  ['shoot_day', '촬영 당일 대기', 4],
  ['arrived', '고객 도착', 5],
  ['addons_in_progress', '부가서비스 진행중', 5],
  ['outfit_checked', '의상 점검 완료', 5],
  ['shooting', '촬영중', 5],
  ['mid_check', '중간 확인 완료', 5],
  ['shoot_complete', '촬영 완료 / 마무리 안내 완료', 5],
  ['selection_pending', '셀렉 대기', 6],
  ['selection_complete', '셀렉 완료', 6],
  ['retouch_assigned', '보정 배정 완료', 6],
  ['retouching', '보정중', 6],
  ['delivered', '전달 완료', 6],
  ['review_requested', '후기 요청 준비', 7],
  ['review_pending', '후기 확인 대기', 7],
  ['review_confirmed', '후기 확인 완료', 7],
  ['originals_pending', '원본 전달 대기', 7],
  ['originals_delivered', '원본 전달 완료', 7],
  ['follow_up', '후속관리중', 7],
] as const;

export type ShootStatus = (typeof STATUS_DEFINITIONS)[number][0] | 'cancelled';

export const STATUSES = STATUS_DEFINITIONS.map(([id, label, stage], index) => ({
  id,
  label,
  stage,
  order: index + 1,
}));

export const STAGE_LABELS = [
  '옵션 선택',
  '일정 선택',
  '설문',
  '촬영 준비',
  '촬영',
  '결과물',
  '후속 관리',
] as const;

export function statusInfo(status: string) {
  return (
    STATUSES.find((item) => item.id === status) ?? {
      id: 'cancelled',
      label: '취소',
      stage: 0,
      order: 0,
    }
  );
}
