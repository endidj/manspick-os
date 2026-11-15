// 설문 최종 제출과 편집 가능 조건이 화면·서버에서 같게 적용되는지 확인합니다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canEditSurvey, surveyIssues } from '../packages/domain/src/survey.ts';

const answers = {
  firstImpression: 5,
  age: 30,
  style: '캐주얼',
  motivation: '프로필 촬영',
  purposes: ['비즈니스'],
  retouchStrength: 0,
  selector: 'customer',
  referral: '지인 소개',
  reviewParticipation: false,
  safetyRead: true,
};

test('survey accepts declining optional consent and zero retouch strength', () => {
  assert.deepEqual(surveyIssues(answers, { wardrobe: false, hasFacePhoto: true }), []);
});

test('final validation catches previously completed fields in their original page', () => {
  const cases = [
    ['age', '', 1],
    ['style', '  ', 2],
    ['motivation', '', 3],
    ['purposes', [], 3],
    ['retouchStrength', null, 3],
    ['retouchStrength', '', 3],
    ['retouchStrength', 37, 3],
    ['referral', '', 4],
    ['reviewParticipation', undefined, 4],
    ['safetyRead', false, 4],
  ] as const;
  for (const [field, value, page] of cases) {
    const issue = surveyIssues(
      { ...answers, [field]: value },
      { wardrobe: false, hasFacePhoto: true },
    )[0];
    assert.equal(issue?.field, field);
    assert.equal(issue.page, page);
  }
});

test('face photos and conditional wardrobe measurements remain required', () => {
  assert.equal(
    surveyIssues(answers, { wardrobe: false, hasFacePhoto: false })[0]?.field,
    'facePhoto',
  );
  const dressed = {
    ...answers,
    height: 178,
    weight: 72,
    topSize: 'L',
    bottomSize: '32',
    shoeSize: 270,
    budget: 500000,
  };
  assert.deepEqual(surveyIssues(dressed, { wardrobe: true, hasFacePhoto: true }), []);
  for (const field of ['height', 'weight', 'topSize', 'bottomSize', 'shoeSize', 'budget']) {
    assert.equal(
      surveyIssues({ ...dressed, [field]: '' }, { wardrobe: true, hasFacePhoto: true })[0]?.field,
      field,
    );
  }
});

test('editing respects payment, shooting stage and submitted deadline together', () => {
  const now = Date.parse('2026-11-16T03:00:00Z');
  const shoot = {
    paymentState: 'confirmed',
    stage: 4,
    survey: { submittedAt: null, dueAt: '2026-11-15T03:00:00Z' },
  };
  assert.equal(canEditSurvey(shoot, now), true, 'a late first submission is still accepted');
  assert.equal(canEditSurvey({ ...shoot, paymentState: 'pending' }, now), false);
  assert.equal(canEditSurvey({ ...shoot, stage: 5 }, now), false);
  assert.equal(
    canEditSurvey(
      { ...shoot, survey: { ...shoot.survey, submittedAt: '2026-11-14T03:00:00Z' } },
      now,
    ),
    false,
  );
});
