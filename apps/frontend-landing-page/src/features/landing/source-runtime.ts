// 원본 맨즈픽의 화면 동작을 React 화면 수명 안에서 실행하고 모두 정리합니다.
import { semanticTokens } from '@manspick/design-system/tokens';
import { createScope, type Scope } from './source-scope';

function attachNearbyImages(scope: Scope) {
  // 렌더를 생략한 섹션도 화면 1,200px 앞에서 사진 다운로드를 시작합니다.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => {
          image.loading = 'eager';
        });
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '1200px 0px' },
  );
  scope.all('main > section').forEach((section) => observer.observe(section));
  scope.cleanup(() => observer.disconnect());
}

function attachReveals(scope: Scope) {
  scope.observe(scope.all('.reveal'), (element) => element.classList.add('in'), {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px',
  });
  const notification = scope.query('#notif-screen');
  if (notification) {
    scope.observe(
      [notification],
      () => {
        scope.all('.notif-card').forEach((card, index) => {
          scope.later(
            () => {
              card.style.opacity = '1';
              card.style.transform = 'translateY(0)';
            },
            scope.reduced ? 0 : index * 180,
          );
        });
      },
      { threshold: 0.3 },
    );
  }
  scope.observe(
    scope.all('.count-up'),
    (element) => {
      const target = Number(element.dataset.count);
      const decimals = Number(element.dataset.decimals || 0);
      const format = (value: number) =>
        element.dataset.separator === 'true'
          ? value.toLocaleString('en-US', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })
          : value.toFixed(decimals);
      const start = performance.now();
      const tick = (now: number) => {
        const progress = scope.reduced ? 1 : Math.min((now - start) / 1800, 1);
        element.textContent = format(target * (1 - (1 - progress) ** 3));
        if (progress < 1) scope.frame(tick);
      };
      tick(start);
    },
    { threshold: 0.4 },
  );
}

function attachPointerEffects(scope: Scope) {
  if (scope.reduced) return;
  const glow = scope.query('#cursor-glow');
  if (glow && !window.matchMedia('(pointer: coarse)').matches) {
    let pending = false;
    scope.on<MouseEvent>(document, 'mousemove', (event) => {
      if (pending) return;
      pending = true;
      scope.frame(() => {
        glow.style.setProperty('--gx', `${event.clientX}px`);
        glow.style.setProperty('--gy', `${event.clientY}px`);
        glow.style.opacity = '1';
        pending = false;
      });
    });
    scope.on(document, 'mouseleave', () => {
      glow.style.opacity = '0';
    });
  }
  const tokens = getComputedStyle(scope.root);
  const colors = [
    semanticTokens.color.action.primary,
    semanticTokens.color.text.accent,
    semanticTokens.color.text.onAccent,
    tokens.getPropertyValue('--mp-site-color-93c5fd'),
    tokens.getPropertyValue('--mp-site-color-60a5fa'),
    tokens.getPropertyValue('--mp-site-color-fbbf24'),
    semanticTokens.color.status.pink,
    semanticTokens.color.status.infoPurple,
  ];
  const particles = new Set<HTMLElement>();
  const animations = new Set<Animation>();
  scope.cleanup(() => {
    animations.forEach((animation) => animation.cancel());
    particles.forEach((particle) => particle.remove());
  });
  const burst = (link: Element, big: boolean) => {
    const rect = link.getBoundingClientRect();
    const count = big ? 50 : 35;
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('div');
      const size = Math.random() * (big ? 8 : 6) + 3;
      const angle = (Math.PI * 2 * index) / count + (Math.random() - 0.5) * 0.8;
      const velocity = Math.random() * (big ? 180 : 130) + 70;
      Object.assign(particle.style, {
        position: 'fixed',
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top + rect.height / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: ['50%', '2px', '0'][index % 3],
        background: colors[index % colors.length],
        pointerEvents: 'none',
        zIndex: '9999',
      });
      scope.root.appendChild(particle);
      particles.add(particle);
      const animation = particle.animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${Math.cos(angle) * velocity}px,${Math.sin(angle) * velocity + 50}px) scale(0) rotate(${Math.random() * 720 - 360}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 800 + Math.random() * 400,
          easing: 'cubic-bezier(.15,.8,.3,1)',
          fill: 'forwards',
        },
      );
      animations.add(animation);
      animation.onfinish = () => {
        particle.remove();
        particles.delete(particle);
        animations.delete(animation);
      };
    }
  };
  let cooldown = false;
  scope.on<MouseEvent>(scope.root, 'mouseover', (event) => {
    const link = (event.target as Element).closest('a[href*="pf.kakao.com"]');
    if (!link || cooldown) return;
    cooldown = true;
    burst(link, false);
    scope.later(() => (cooldown = false), 1500);
  });
  scope.on<MouseEvent>(scope.root, 'click', (event) => {
    const link = (event.target as Element).closest('a[href*="pf.kakao.com"]');
    if (link) burst(link, true);
  });
}

function attachNavigation(scope: Scope) {
  const toggle = scope.query('#mobile-menu-toggle');
  const menu = scope.query('#mobile-menu');
  const setMenu = (open: boolean) => {
    menu?.classList.toggle('hidden', !open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    scope.all('[data-menu-icon]').forEach((icon) => {
      icon.style.display = (icon.dataset.menuIcon === 'close') === open ? 'inline-block' : 'none';
    });
  };
  setMenu(false);
  scope.on(toggle, 'click', () => setMenu(menu?.classList.contains('hidden') ?? false));
  scope.all('.mobile-nav-link').forEach((link) => scope.on(link, 'click', () => setMenu(false)));
  scope.on(window, 'resize', () => {
    if (window.innerWidth >= 1024) setMenu(false);
  });
  scope.on(scope.query('#back-to-top'), 'click', () => {
    window.scrollTo({ top: 0, behavior: scope.reduced ? 'instant' : 'smooth' });
  });
  const faqToggle = scope.query('#faq-toggle');
  const faqMore = scope.query('#faq-more');
  // JS가 동작할 때만 추가 질문을 접어 기본 HTML에서도 모든 답변을 열 수 있게 합니다.
  faqMore?.classList.add('hidden');
  faqToggle?.classList.remove('hidden');
  scope.cleanup(() => {
    faqMore?.classList.remove('hidden');
    faqToggle?.classList.add('hidden');
  });
  scope.on(faqToggle, 'click', () => {
    const open = faqMore?.classList.contains('hidden') ?? false;
    faqMore?.classList.toggle('hidden', !open);
    faqToggle?.setAttribute('aria-expanded', String(open));
    const text = scope.query('#faq-toggle-text');
    const icon = scope.query('#faq-toggle-icon');
    if (text) text.textContent = open ? '접기' : '질문 더보기';
    if (icon) icon.style.transform = open ? 'rotate(180deg)' : '';
  });
  const hero = scope.query('#hero');
  const promo = scope.query('#promo-bar');
  const scrollHint = scope.query('#hero-scroll-hint');
  const nav = scope.query('#main-nav');
  const final = scope.query('#cta');
  const sticky = [
    [scope.query('#sticky-cta'), 'translate-y-4'],
    [scope.query('#live-viewers-badge'), 'translate-y-2'],
    [scope.query('#floating-social'), 'translate-y-2'],
  ] as const;
  const update = () => {
    if (scrollHint) scrollHint.style.opacity = window.scrollY > 48 ? '0' : '1';
    const promoVisible = !!hero && hero.getBoundingClientRect().bottom < 0;
    promo?.classList.toggle('-translate-y-full', !promoVisible);
    promo?.classList.toggle('translate-y-0', promoVisible);
    if (nav) nav.style.top = promoVisible ? '34px' : '';
    const show =
      window.scrollY > window.innerHeight * 0.7 &&
      (!final || final.getBoundingClientRect().top >= window.innerHeight * 0.85);
    sticky.forEach(([element, transform]) => {
      ['opacity-0', transform, 'pointer-events-none'].forEach((name) =>
        element?.classList.toggle(name, !show),
      );
      element?.setAttribute('aria-hidden', String(!show));
      if (element) element.inert = !show;
    });
  };
  scope.on(window, 'scroll', update, { passive: true });
  scope.on(window, 'resize', update, { passive: true });
  update();
}

function attachModals(scope: Scope) {
  let request = 0;
  let busy: HTMLElement | undefined;
  let errorMessage: HTMLElement | undefined;
  let modulePromise: Promise<typeof import('./source-modal-runtime')> | undefined;
  let modals: ReturnType<typeof import('./source-modal-runtime').createSourceModals> | undefined;
  const clearError = () => {
    errorMessage?.remove();
    errorMessage = undefined;
  };
  const cancel = () => {
    request++;
    busy?.removeAttribute('aria-busy');
    busy = undefined;
    clearError();
  };
  scope.cleanup(cancel);
  scope.on<KeyboardEvent>(document, 'keydown', (event) => {
    if (event.key === 'Escape') cancel();
  });
  const open = async (kind: 'lead' | 'team', trigger: HTMLElement) => {
    cancel();
    const currentRequest = request;
    const isCurrent = () => scope.isActive() && request === currentRequest;
    trigger.focus({ preventScroll: true });
    trigger.setAttribute('aria-busy', 'true');
    busy = trigger;
    try {
      modulePromise ??= import('./source-modal-runtime').catch((error: unknown) => {
        modulePromise = undefined;
        throw error;
      });
      const { createSourceModals } = await modulePromise;
      if (!isCurrent()) return;
      modals ??= createSourceModals(scope, cancel);
      await modals.open(kind, trigger, isCurrent);
    } catch {
      if (!isCurrent()) return;
      errorMessage = document.createElement('p');
      errorMessage.dataset.sourceModuleError = 'true';
      errorMessage.setAttribute('role', 'status');
      errorMessage.className = 'text-sm text-red-400';
      errorMessage.textContent = '내용을 불러오지 못했습니다. 다시 눌러 주세요.';
      trigger.insertAdjacentElement('afterend', errorMessage);
    } finally {
      if (isCurrent()) {
        trigger.removeAttribute('aria-busy');
        busy = undefined;
      }
    }
  };
  scope.all('#open-leadmodal-cta, [data-open-lead-modal]').forEach((trigger) =>
    scope.on(trigger, 'click', (event) => {
      event.preventDefault();
      void open('lead', trigger);
    }),
  );
  scope
    .all('.team-card')
    .forEach((trigger) => scope.on(trigger, 'click', () => void open('team', trigger)));
}

function attachRotation(scope: Scope) {
  if (scope.reduced) return;
  const image = scope.query<HTMLImageElement>('#team-influencer-img');
  if (image) {
    let tick: (() => void) | undefined;
    let pending = false;
    const prepare = async () => {
      if (pending || tick || !scope.isActive()) return;
      pending = true;
      try {
        const { createImageRotation } = await import('./source-media-runtime');
        if (scope.isActive()) tick = createImageRotation(scope, image);
      } catch {
        // 현재 사진을 유지하고 화면에 있을 때 다음 주기에 다시 시도합니다.
      } finally {
        pending = false;
      }
    };
    scope.observe([image], () => void prepare(), { rootMargin: '400px' });
    scope.every(() => {
      const rect = image.getBoundingClientRect();
      if (rect.bottom < -400 || rect.top > window.innerHeight + 400) return;
      if (tick) tick();
      else void prepare();
    }, 4000);
  }
  const cta = scope.query('#cta-toggle');
  if (cta) {
    let positive = false;
    scope.every(() => {
      cta.style.opacity = '0';
      scope.later(() => {
        positive = !positive;
        const word = document.createElement('span');
        word.className = positive ? 'text-accent-400' : 'text-red-400';
        word.textContent = positive ? '호감' : '비호감';
        cta.replaceChildren(word, '인가요?');
        cta.style.opacity = '1';
      }, 400);
    }, 2500);
  }
  const sticky = scope.query('#sticky-cta-text');
  if (!sticky) return;
  const mobile = window.innerWidth < 640;
  const messages = mobile
    ? [
        '<span class="text-accent-400 font-semibold">호감</span> vs <span class="text-red-400 font-semibold">비호감</span>, 당신은?',
        '<span class="text-accent-400 font-semibold">첫인상</span>과 반응이 <span class="text-white font-semibold">180도</span> 바뀝니다',
        '<span class="text-accent-400 font-semibold">1,127명</span>이 변했습니다, <span class="text-white font-semibold">다음은 당신</span>',
      ]
    : [
        '당신의 프로필은 <span class="text-accent-400 font-semibold">호감</span>인가요 <span class="text-red-400 font-semibold">비호감</span>인가요?',
        '프로필 하나로 <span class="text-accent-400 font-semibold">첫인상</span>과 주변 반응이 <span class="text-white font-semibold">180도</span> 바뀝니다',
        '<span class="text-accent-400 font-semibold">1,127명</span>이 이미 바뀌었습니다, <span class="text-white font-semibold">다음은 당신 차례입니다</span>',
      ];
  let index = 0;
  scope.every(() => {
    sticky.style.opacity = '0';
    scope.later(() => {
      index = (index + 1) % messages.length;
      // These are fixed source strings, never user-controlled HTML.
      sticky.innerHTML = messages[index];
      sticky.style.opacity = '1';
    }, 300);
  }, 3500);
}

function attachSourceIndicators(scope: Scope) {
  // These source presentation indicators intentionally never modify booking data.
  const packages = {
    one: { total: 14, remaining: 6, label: 'ONE' },
    hybrid: { total: 10, remaining: 3, label: 'HYBRID' },
    allday: { total: 6, remaining: 2, label: 'ALL DAY' },
  };
  const renderSlots = (animate = false) => {
    scope.all('.slot-info').forEach((element) => {
      const item = packages[element.dataset.package as keyof typeof packages];
      if (!item) return;
      const remaining = element.querySelector<HTMLElement>('.slot-remaining');
      const total = element.querySelector('.slot-total');
      const bar = element.querySelector<HTMLElement>('.slot-bar');
      const urgent = element.querySelector('.slot-urgent');
      if (remaining) remaining.textContent = String(item.remaining);
      if (total) total.textContent = String(item.total);
      if (bar) bar.style.width = `${(item.remaining / item.total) * 100}%`;
      const isUrgent = item.remaining <= 3;
      bar?.classList.toggle('bg-accent-500', !isUrgent);
      bar?.classList.toggle('bg-red-500', isUrgent);
      remaining?.classList.toggle('text-accent-400', !isUrgent);
      remaining?.classList.toggle('text-red-400', isUrgent);
      urgent?.classList.toggle('hidden', !isUrgent);
      urgent?.classList.toggle('flex', isUrgent);
      if (animate && remaining) {
        remaining.classList.add('scale-125');
        scope.later(() => remaining.classList.remove('scale-125'), 400);
      }
    });
    const seats = scope.query('#promo-seats');
    if (seats)
      seats.textContent = String(
        Object.values(packages).reduce((sum, item) => sum + item.remaining, 0),
      );
  };
  renderSlots();
  const updateClock = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'numeric',
    }).formatToParts(now);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const promoMonth = scope.query('#promo-month-label');
    const ctaMonth = scope.query('#cta-month-label');
    if (promoMonth) promoMonth.textContent = `${month}월 한정 최대 44% 할인`;
    if (ctaMonth)
      ctaMonth.textContent = `${year}년 ${month}월 잔여 7석 · ${month === 12 ? 1 : month + 1}월 예약 오픈`;
    const timer = scope.query('#promo-timer');
    if (timer) {
      let seconds = Math.max(
        0,
        Math.floor(
          (new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - now.getTime()) / 1000,
        ),
      );
      const days = Math.floor(seconds / 86400);
      seconds %= 86400;
      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;
      const minutes = Math.floor(seconds / 60);
      const pad = (value: number) => String(value).padStart(2, '0');
      timer.textContent = `${days}일 ${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}`;
    }
  };
  updateClock();
  scope.every(updateClock, 1000);
  const leadRemaining = scope.query('#lead-remaining');
  const leadBarText = scope.query('#lead-remaining-bar-text');
  const leadBar = scope.query('#lead-bar');
  const recent = scope.query('#lead-recent');
  let remaining = 23;
  try {
    const saved: { r?: number; d?: string } | null = JSON.parse(
      localStorage.getItem('manspick-lead') || 'null',
    );
    if (saved?.d === new Date().toDateString() && Number.isFinite(saved.r))
      remaining = Math.max(1, Math.min(100, saved.r!));
  } catch {
    // Storage may be unavailable in private browsing; the source default remains usable.
  }
  const renderLead = () => {
    if (leadRemaining) leadRemaining.textContent = String(remaining);
    if (leadBarText) leadBarText.textContent = String(remaining);
    if (leadBar) leadBar.style.width = `${remaining}%`;
  };
  renderLead();
  if (scope.reduced) return;
  const toast = scope.query('#slot-toast');
  const toastText = scope.query('#slot-toast-text');
  const decrementSlot = () => {
    const eligible = Object.values(packages).filter((item) => item.remaining > 1);
    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    if (selected) {
      selected.remaining -= 1;
      renderSlots(true);
      if (toast && toastText) {
        toastText.textContent = `방금 ${selected.label} 패키지 1석이 마감되었어요`;
        toast.classList.remove('opacity-0', 'translate-y-2');
        scope.later(() => toast.classList.add('opacity-0', 'translate-y-2'), 3800);
      }
    }
    scope.later(decrementSlot, 22000 + Math.random() * 33000);
  };
  scope.later(decrementSlot, 15000 + Math.random() * 10000);
  const rotateRecent = () => {
    if (!recent) return;
    const names = ['김○○', '이○○', '박○○', '최○○', '정○○', '강○○', '조○○', '윤○○', '장○○', '임○○'];
    const minutes = [1, 2, 3, 4, 5, 7, 8, 12, 15];
    const text = recent.querySelector('span:last-child');
    if (text)
      text.textContent = `${minutes[Math.floor(Math.random() * minutes.length)]}분 전 ${names[Math.floor(Math.random() * names.length)]}님이 방금 신청했어요`;
    recent.classList.add('opacity-0');
    scope.later(() => recent.classList.remove('opacity-0'), 120);
  };
  const decrementLead = () => {
    if (remaining > 1) {
      remaining -= 1;
      renderLead();
      rotateRecent();
      try {
        localStorage.setItem(
          'manspick-lead',
          JSON.stringify({ r: remaining, d: new Date().toDateString() }),
        );
      } catch {
        // A storage failure does not prevent the consultation form from working.
      }
    }
    scope.later(decrementLead, 28000 + Math.random() * 40000);
  };
  scope.later(decrementLead, 18000 + Math.random() * 14000);
  scope.every(rotateRecent, 12000 + Math.random() * 6000);
  const viewers = scope.query('#live-viewers');
  if (viewers) {
    let count = 23;
    const tick = () => {
      count = Math.max(12, Math.min(47, count + Math.floor(Math.random() * 7) - 3));
      viewers.textContent = String(count);
      scope.later(tick, 4000 + Math.random() * 4000);
    };
    scope.later(tick, 4000);
  }
}

export function attachSourceInteractions(root: HTMLElement): () => void {
  const scope = createScope(root);
  root.dataset.motionReady = 'true';
  scope.cleanup(() => delete root.dataset.motionReady);
  attachNearbyImages(scope);
  attachReveals(scope);
  attachPointerEffects(scope);
  attachNavigation(scope);
  attachModals(scope);
  attachRotation(scope);
  attachSourceIndicators(scope);
  return scope.dispose;
}
