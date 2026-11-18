// 랜딩 효과와 지연 기능이 같은 이벤트·타이머 수명과 해제를 공유합니다.
export type Scope = ReturnType<typeof createScope>;

export function createScope(root: HTMLElement) {
  const cleanups: Array<() => void> = [];
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = true;
  const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);
  const all = <T extends Element = HTMLElement>(selector: string) =>
    Array.from(root.querySelectorAll<T>(selector));
  const later = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      timeouts.delete(id);
      if (active) callback();
    }, delay);
    timeouts.add(id);
    return id;
  };
  const every = (callback: () => void, delay: number) => {
    const id = window.setInterval(callback, delay);
    intervals.add(id);
    return id;
  };
  const frame = (callback: FrameRequestCallback) => {
    const id = requestAnimationFrame((now) => {
      frames.delete(id);
      if (active) callback(now);
    });
    frames.add(id);
    return id;
  };
  const on = <T extends Event>(
    target: EventTarget | null,
    type: string,
    callback: (event: T) => void,
    options?: AddEventListenerOptions,
  ) => {
    const listener = callback as EventListener;
    target?.addEventListener(type, listener, options);
    cleanups.push(() => target?.removeEventListener(type, listener, options));
  };
  const observe = (
    elements: HTMLElement[],
    callback: (element: HTMLElement) => void,
    options: IntersectionObserverInit,
  ) => {
    if (reduced) {
      elements.forEach(callback);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      });
    }, options);
    elements.forEach((element) => observer.observe(element));
    cleanups.push(() => observer.disconnect());
  };
  return {
    root,
    isActive: () => active && root.isConnected,
    query,
    all,
    reduced,
    later,
    every,
    frame,
    on,
    observe,
    cleanup: (callback: () => void) => cleanups.push(callback),
    dispose: () => {
      active = false;
      timeouts.forEach(window.clearTimeout);
      intervals.forEach(window.clearInterval);
      frames.forEach(cancelAnimationFrame);
      cleanups.reverse().forEach((cleanup) => cleanup());
    },
  };
}
