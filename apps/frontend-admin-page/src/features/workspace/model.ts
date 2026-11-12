// 운영 메뉴와 역할 이름, 화면별 목록 의존성을 한곳에 모읍니다.
import type { StaffRole } from '@manspick/domain';

export type View =
  | 'board'
  | 'detail'
  | 'list'
  | 'calendar'
  | 'requests'
  | 'notifications'
  | 'templates'
  | 'packages'
  | 'followups'
  | 'settings'
  | 'retouch'
  | 'completed'
  | 'my-customers'
  | 'today'
  | 'profile';

export type DetailScreen = 'overview' | 'manage' | 'field' | 'candidates' | 'retouch';

export const roles: {
  id: StaffRole;
  label: string;
}[] = [
  { id: 'admin', label: '대표' },
  { id: 'staff', label: '운영 직원' },
  { id: 'director', label: '디렉터' },
  { id: 'retoucher', label: '보정가' },
];

export const menu: { id: View; label: string; icon: string }[] = [
  { id: 'board', label: '고객 보드', icon: 'board' },
  { id: 'detail', label: '고객 상세', icon: 'solar/user-id-bold' },
  { id: 'calendar', label: '디렉터 배정·스케줄', icon: 'calendar' },
  { id: 'retouch', label: '보정 작업', icon: 'solar/magic-stick-3-bold' },
  { id: 'templates', label: '안내 템플릿', icon: 'solar/document-text-bold' },
  { id: 'packages', label: '패키지·옵션', icon: 'solar/tag-price-bold' },
  { id: 'followups', label: '후속 이벤트', icon: 'solar/gift-bold' },
  { id: 'settings', label: '운영 설정', icon: 'settings' },
];

const directorMenu: typeof menu = [
  { id: 'my-customers', label: '내 고객', icon: 'people' },
  { id: 'today', label: '오늘 촬영', icon: 'camera' },
  { id: 'profile', label: '내 정보', icon: 'solar/user-bold' },
];

const retoucherMenu: typeof menu = [
  { id: 'retouch', label: '내 보정 작업', icon: 'solar/magic-stick-3-bold' },
  { id: 'completed', label: '완료 내역', icon: 'solar/check-read-bold' },
];

export function visibleMenu(role: StaffRole) {
  if (role === 'director') return directorMenu;
  if (role === 'retoucher') return retoucherMenu;
  return menu.filter((item) => item.id !== 'settings' || role === 'admin');
}

export function resolveView(requested: string | null, role: StaffRole): View {
  const available = visibleMenu(role);
  if (
    (role === 'admin' || role === 'staff') &&
    (requested === 'list' || requested === 'requests' || requested === 'notifications')
  )
    return requested;
  return available.find((item) => item.id === requested)?.id ?? available[0]!.id;
}

export function needsShootList(view: View) {
  return (
    view === 'my-customers' ||
    view === 'today' ||
    view === 'retouch' ||
    view === 'completed' ||
    view === 'detail'
  );
}

export function requestedView(role: StaffRole = 'staff'): View {
  return resolveView(new URLSearchParams(window.location.search).get('view'), role);
}

export function detailScreen(requested: string | null, role: StaffRole): DetailScreen {
  if (role === 'retoucher') return 'retouch';
  if (role === 'director')
    return requested === 'field' || requested === 'candidates' ? requested : 'manage';
  return 'overview';
}

export function shootHref(id: string, screen?: DetailScreen): string {
  return `/shoots/${encodeURIComponent(id)}${screen ? `?screen=${screen}` : ''}`;
}
