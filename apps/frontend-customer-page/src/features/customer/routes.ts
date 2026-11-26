// 개인 촬영 화면·설문 페이지의 경로를 검증하고 직접 진입 시 돌아갈 화면을 정합니다.
import type { CustomerScene } from './journey';

const scenes: CustomerScene[] = [
  'payment',
  'survey',
  'survey-complete',
  'preparation',
  'plan',
  'shoot-day',
];

export function customerRoute(segments: string[]) {
  if (!segments.length) return { scene: 'home' as CustomerScene, surveyPage: null };
  const scene = segments[0] as CustomerScene;
  if (!scenes.includes(scene)) return null;
  if (scene === 'survey' && segments.length === 2 && /^[1-4]$/.test(segments[1]!))
    return { scene, surveyPage: Number(segments[1]) };
  return segments.length === 1 ? { scene, surveyPage: null } : null;
}

export function customerPath(token: string, scene: CustomerScene, surveyPage = 1) {
  const root = `/s/${encodeURIComponent(token)}`;
  if (scene === 'home') return root;
  return `${root}/${scene}${scene === 'survey' ? `/${surveyPage}` : ''}`;
}

export function customerParent(token: string, scene: CustomerScene, surveyPage: number | null) {
  if (scene === 'survey' && surveyPage && surveyPage > 1)
    return customerPath(token, 'survey', surveyPage - 1);
  const parent: Partial<Record<CustomerScene, CustomerScene>> = {
    plan: 'preparation',
  };
  return customerPath(token, parent[scene] ?? 'home');
}
