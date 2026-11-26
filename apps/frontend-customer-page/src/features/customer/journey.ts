// 서버 상태를 고객이 볼 화면과 다섯 단계 여정으로 연결합니다.
import { koreaDate, statusInfo } from '@manspick/domain';
import type { ShootStatus } from '@manspick/domain';

export type CustomerScene =
  'home' | 'payment' | 'survey' | 'survey-complete' | 'preparation' | 'plan' | 'shoot-day';

export type JourneyState =
  'options' | 'payment' | 'survey' | 'preparation' | 'shoot-day' | 'complete' | 'cancelled';

type JourneyInput = {
  status: ShootStatus;
  startsAt: string | null;
  paymentState: string;
  survey?: { submittedAt: string | null; answers: Record<string, unknown> } | null;
};

type Journey = { state: JourneyState; stage: number; scene: CustomerScene | null };

export function isShootToday(startsAt: string | null, now = new Date()) {
  if (!startsAt) return false;
  const start = new Date(startsAt);
  return Number.isFinite(start.getTime()) && koreaDate(start) === koreaDate(now);
}

export function resolveJourney(shoot: JourneyInput, now = new Date()): Journey {
  const status = statusInfo(shoot.status);
  if (shoot.status === 'cancelled') return { state: 'cancelled', stage: 0, scene: null };
  if (status.stage === 1) return { state: 'options', stage: 1, scene: 'home' };
  if (status.stage <= 4 && shoot.paymentState !== 'confirmed')
    return { state: 'payment', stage: 2, scene: 'payment' };
  if (status.stage <= 4 && !shoot.survey?.submittedAt)
    return { state: 'survey', stage: 3, scene: 'survey' };
  if (status.stage >= 6 || shoot.status === 'shoot_complete')
    return { state: 'complete', stage: 5, scene: 'shoot-day' };
  if (status.stage === 5 || shoot.status === 'shoot_day' || isShootToday(shoot.startsAt, now))
    return { state: 'shoot-day', stage: 5, scene: 'shoot-day' };
  if (shoot.survey?.submittedAt) return { state: 'preparation', stage: 4, scene: 'preparation' };
  return { state: 'survey', stage: 3, scene: 'survey' };
}
