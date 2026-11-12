// 서버 상태를 고객이 볼 화면과 일곱 단계 여정으로 연결합니다.
import { statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';

export type CustomerScene =
  | 'home'
  | 'payment'
  | 'survey'
  | 'survey-complete'
  | 'preparation'
  | 'plan'
  | 'shoot-day'
  | 'selection'
  | 'results'
  | 'extra-retouch'
  | 'revision'
  | 'review';

export type JourneyState =
  | 'options'
  | 'payment'
  | 'survey'
  | 'preparation'
  | 'shoot-day'
  | 'selection'
  | 'director-selection'
  | 'retouching'
  | 'results'
  | 'follow-up'
  | 'cancelled';

type JourneyInput = {
  status: ShootStatus;
  startsAt: string | null;
  paymentState: string;
  selectionMode?: 'customer' | 'director' | null;
  survey?: { submittedAt: string | null; answers: Record<string, unknown> } | null;
};

type Journey = { state: JourneyState; stage: number; scene: CustomerScene | null };

export function koreanDay(value: string | Date) {
  return new Date(value).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

export function resolveJourney(shoot: JourneyInput, now = new Date()): Journey {
  const status = statusInfo(shoot.status);
  if (shoot.status === 'cancelled') return { state: 'cancelled', stage: 0, scene: null };
  if (status.stage === 1) return { state: 'options', stage: 1, scene: 'home' };
  if (status.stage <= 2 && shoot.paymentState !== 'confirmed')
    return { state: 'payment', stage: 2, scene: 'payment' };
  if (status.stage === 7) return { state: 'follow-up', stage: 7, scene: 'review' };
  if (shoot.status === 'delivered') return { state: 'results', stage: 6, scene: 'results' };
  if (shoot.status === 'selection_pending') {
    const mode = shoot.selectionMode ?? shoot.survey?.answers.selector;
    return {
      state: mode === 'director' ? 'director-selection' : 'selection',
      stage: 6,
      scene: 'selection',
    };
  }
  if (status.stage === 6 || shoot.status === 'shoot_complete')
    return { state: 'retouching', stage: 6, scene: 'results' };
  if (
    status.stage === 5 ||
    shoot.status === 'shoot_day' ||
    (shoot.startsAt && koreanDay(shoot.startsAt) === koreanDay(now))
  )
    return { state: 'shoot-day', stage: 5, scene: 'shoot-day' };
  if (shoot.survey?.submittedAt || status.stage === 4)
    return { state: 'preparation', stage: 4, scene: 'preparation' };
  return { state: 'survey', stage: 3, scene: 'survey' };
}

export function daysUntil(startsAt: string | null, now = new Date()) {
  if (!startsAt) return null;
  return Math.round((Date.parse(koreanDay(startsAt)) - Date.parse(koreanDay(now))) / 86400000);
}
