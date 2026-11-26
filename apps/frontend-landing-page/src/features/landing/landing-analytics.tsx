// 첫 페이지의 실제 표시 섹션과 가시 상태에서 머문 시간만 집계합니다.
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@manspick/web/client';

export function LandingAnalytics() {
  const path = usePathname();
  useEffect(() => {
    if (path !== '/') return;
    const sections = Array.from(document.querySelectorAll('main > section'));
    if (!sections.length) return;
    const name = (element: Element) => element.id || 'section-' + (sections.indexOf(element) + 1);
    let current = '',
      began = 0,
      frame = 0,
      exited = false;
    function flush() {
      if (current && began)
        trackEvent('section_dwell', {
          section: current,
          durationMs: Math.min(86_400_000, Math.round(performance.now() - began)),
        });
      began = 0;
    }
    function sample() {
      frame = 0;
      if (document.hidden) return;
      const center = window.innerHeight * 0.45;
      const next = sections.find((node) => {
        const box = node.getBoundingClientRect();
        return box.top <= center && box.bottom > center;
      });
      if (!next) return;
      const key = name(next);
      if (current !== key) {
        flush();
        current = key;
        trackEvent('section_view', { section: key });
      }
      if (!began) began = performance.now();
    }
    function queue() {
      if (!frame) frame = requestAnimationFrame(sample);
    }
    function click(e: MouseEvent) {
      const target =
        e.target instanceof Element ? e.target.closest('a,button,[role="button"]') : null;
      const section = target?.closest('main > section');
      if (section) trackEvent('section_click', { section: name(section) });
    }
    function visibility() {
      if (document.hidden) flush();
      else sample();
    }
    function exit() {
      flush();
      if (current && !exited) {
        trackEvent('section_exit', { section: current });
        exited = true;
      }
    }
    function resume() {
      exited = false;
      sample();
    }
    trackEvent('landing_visit');
    sample();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('pagehide', exit);
    window.addEventListener('pageshow', resume);
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      exit();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('pagehide', exit);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [path]);
  return null;
}
