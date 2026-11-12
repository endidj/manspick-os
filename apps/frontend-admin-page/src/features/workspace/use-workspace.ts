// 현재 직원의 역할과 브라우저 주소로 운영 메뉴를 선택합니다.
'use client';

import { useSyncExternalStore } from 'react';
import { useStaffSession } from '../authentication';
import { requestedView, resolveView, type View } from './model';

const navigationEvent = 'admin-view-change';

function subscribeToNavigation(notify: () => void) {
  window.addEventListener('popstate', notify);
  window.addEventListener(navigationEvent, notify);
  return () => {
    window.removeEventListener('popstate', notify);
    window.removeEventListener(navigationEvent, notify);
  };
}

export function useWorkspace() {
  const { clearError, ...staff } = useStaffSession();
  const role = staff.session?.actor.role;
  const view = useSyncExternalStore(
    subscribeToNavigation,
    () => (role && role !== 'customer' ? requestedView(role) : 'board'),
    (): View => 'board',
  );

  function navigate(next: View) {
    if (!role || role === 'customer') return;
    const available = resolveView(next, role);
    clearError();
    window.history.pushState(null, '', `/?view=${available}`);
    window.dispatchEvent(new Event(navigationEvent));
  }

  return { ...staff, view, navigate };
}
