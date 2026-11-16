// 고객 설문의 페이지별 필수 응답과 제출 후 편집 기한을 함께 검사합니다.
export type SurveyIssue = { page: number; field: string; message: string };

export function surveyIssues(
  answers: Record<string, unknown>,
  { wardrobe, hasFacePhoto }: { wardrobe: boolean; hasFacePhoto: boolean },
): SurveyIssue[] {
  const issues: SurveyIssue[] = [];

  const text = (key: string) =>
    typeof answers[key] === 'string' && String(answers[key]).trim().length > 0;

  const numeric = (key: string) =>
    (typeof answers[key] === 'number' || text(key)) && Number.isFinite(Number(answers[key]));

  const addIssue = (valid: boolean, page: number, field: string, message: string) => {
    if (!valid) issues.push({ page, field, message });
  };

  addIssue(
    numeric('firstImpression') && [1, 2, 3, 4, 5].includes(Number(answers.firstImpression)),
    1,
    'firstImpression',
    '첫 인사 메시지의 별점을 선택해주세요.',
  );
  addIssue(
    numeric('age') && Number(answers.age) > 0 && Number(answers.age) <= 120,
    1,
    'age',
    '나이를 1~120 사이로 입력해주세요.',
  );
  addIssue(hasFacePhoto, 1, 'facePhoto', '최근 얼굴 사진을 한 장 이상 올려주세요.');
  addIssue(Boolean(text('style')), 2, 'style', '원하는 스타일을 선택해주세요.');
  if (wardrobe) {
    for (const [key, label] of [
      ['height', '키'],
      ['weight', '몸무게'],
      ['topSize', '상의 사이즈'],
      ['bottomSize', '하의 사이즈'],
      ['shoeSize', '신발 사이즈'],
      ['budget', '코디 예산'],
    ]) {
      const valid = ['topSize', 'bottomSize'].includes(key)
        ? Boolean(text(key))
        : numeric(key) && Number(answers[key]) > 0;
      addIssue(valid, 2, key, `${label}를 입력해주세요. 의상 옵션 준비에 필요해요.`);
    }
  }
  addIssue(Boolean(text('motivation')), 3, 'motivation', '촬영하게 된 계기를 알려주세요.');
  addIssue(
    Array.isArray(answers.purposes) &&
      answers.purposes.length > 0 &&
      answers.purposes.every((item) => typeof item === 'string' && item.trim().length > 0),
    3,
    'purposes',
    '사진을 사용할 곳을 한 가지 이상 선택해주세요.',
  );
  addIssue(
    numeric('retouchStrength') && [0, 25, 50, 75, 100].includes(Number(answers.retouchStrength)),
    3,
    'retouchStrength',
    '원하는 보정 강도를 선택해주세요.',
  );
  addIssue(
    ['customer', 'director'].includes(String(answers.selector)),
    3,
    'selector',
    '보정할 사진을 누가 고를지 선택해주세요.',
  );
  addIssue(Boolean(text('referral')), 4, 'referral', '맨즈픽을 알게 된 경로를 선택해주세요.');
  addIssue(
    typeof answers.reviewParticipation === 'boolean',
    4,
    'reviewParticipation',
    '후기 작성 혜택 참여 여부를 선택해주세요.',
  );
  addIssue(answers.safetyRead === true, 4, 'safetyRead', '촬영 전 주의사항을 확인해주세요.');
  return issues;
}

export function canEditSurvey(
  shoot: {
    paymentState: string;
    stage: number;
    survey?: { submittedAt: string | null; dueAt: string | null } | null;
  },
  now = Date.now(),
) {
  return (
    shoot.paymentState === 'confirmed' &&
    shoot.stage >= 2 &&
    shoot.stage <= 4 &&
    !(shoot.survey?.submittedAt && shoot.survey.dueAt && Date.parse(shoot.survey.dueAt) < now)
  );
}
