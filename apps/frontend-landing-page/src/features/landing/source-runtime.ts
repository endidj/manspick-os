// 원본 맨즈픽의 화면 동작을 React 화면 수명 안에서 실행하고 모두 정리합니다.
import { sourceImageUrls, type SourceImageName } from '@manspick/design-system/assets';
import { semanticTokens } from '@manspick/design-system/tokens';
import { attachSourceRadar } from './source-radar';

type Scope = ReturnType<typeof createScope>;

function createScope(root: HTMLElement) {
  const cleanups: Array<() => void> = [];
  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  const frames = new Set<number>();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = true;
  const query = <T extends HTMLElement = HTMLElement>(selector: string) =>
    root.querySelector<T>(selector);
  const all = <T extends HTMLElement = HTMLElement>(selector: string) =>
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
  const nav = scope.query('#main-nav');
  const final = scope.query('#cta');
  const sticky = [
    [scope.query('#sticky-cta'), 'translate-y-4'],
    [scope.query('#live-viewers-badge'), 'translate-y-2'],
    [scope.query('#floating-social'), 'translate-y-2'],
  ] as const;
  const update = () => {
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

function createModal(scope: Scope, id: string) {
  const modal = scope.query(`#${id}`);
  let previousFocus: HTMLElement | null = null;
  let previousOverflow = '';
  let open = false;
  const close = () => {
    if (!open || !modal) return;
    open = false;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus();
  };
  scope.on(scope.query(`#${id}-close`), 'click', close);
  scope.on(scope.query(`.${id}-backdrop`), 'click', close);
  scope.on<KeyboardEvent>(document, 'keydown', (event) => {
    if (!open || !modal) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key !== 'Tab') return;
    const focusables = Array.from(
      modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const first = focusables[0];
    const last = focusables.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  scope.cleanup(close);
  return () => {
    if (!modal || open) return;
    previousFocus = document.activeElement as HTMLElement | null;
    previousOverflow = document.body.style.overflow;
    open = true;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.style.overflow = 'hidden';
    scope.query(`#${id}-close`)?.focus({ preventScroll: true });
  };
}

function attachModals(scope: Scope) {
  const openLead = createModal(scope, 'lead-modal');
  scope.all('#open-leadmodal-cta, [data-open-lead-modal]').forEach((trigger) =>
    scope.on(trigger, 'click', (event) => {
      event.preventDefault();
      openLead();
    }),
  );
  const openTeam = createModal(scope, 'team-modal');
  const teams = {
    influencer: { eyebrow: 'Fashion', title: '인플루언서팀', prefix: 'team-influencer' },
    retouch: { eyebrow: 'Retouching', title: '보정팀', prefix: 'team-retouch' },
    hair: { eyebrow: 'Hair & Design', title: '헤어/패션디자이너팀', prefix: 'team-hair' },
  };
  scope.all('.team-card').forEach((card) => {
    scope.on(card, 'click', () => {
      const key = card.dataset.team as keyof typeof teams;
      const team = teams[key];
      const grid = scope.query('#team-modal-grid');
      const title = scope.query('#team-modal-title');
      const eyebrow = scope.query('#team-modal-eyebrow');
      if (!team || !grid || !title || !eyebrow) return;
      title.textContent = team.title;
      eyebrow.textContent = team.eyebrow;
      let sources = Array.from({ length: 9 }, (_, index) => {
        const extension = key === 'influencer' && index === 6 ? 'JPG' : 'jpg';
        return `${team.prefix}-${index + 1}.${extension}`;
      });
      if (key === 'retouch') {
        const pool = Array.from(
          { length: 12 },
          (_, index) => `스타일링 포트폴리오 ${index + 1}.png`,
        );
        for (let index = pool.length - 1; index > 0; index -= 1) {
          const random = Math.floor(Math.random() * (index + 1));
          [pool[index], pool[random]] = [pool[random], pool[index]];
        }
        sources = pool.slice(0, 9);
      }
      grid.replaceChildren(
        ...sources.map((filename, index) => {
          const frame = document.createElement('div');
          frame.className = 'relative aspect-square overflow-hidden bg-zinc-900';
          const image = document.createElement('img');
          image.src = sourceImageUrls[filename as SourceImageName];
          image.alt = `${team.title} 작업물 ${index + 1}`;
          image.className =
            'w-full h-full object-cover transition-transform duration-500 hover:scale-105';
          image.loading = 'lazy';
          image.decoding = 'async';
          frame.appendChild(image);
          return frame;
        }),
      );
      openTeam();
    });
  });
}

function attachLeadForm(scope: Scope) {
  const form = scope.query<HTMLFormElement>('#lead-form');
  const name = scope.query<HTMLInputElement>('#lead-name');
  const phone = scope.query<HTMLInputElement>('#lead-phone');
  const consent = scope.query<HTMLInputElement>('#privacy-agree');
  const submit = scope.query<HTMLButtonElement>('#lead-submit-btn');
  const thankyou = scope.query('#lead-thankyou');
  if (!form || !name || !phone || !consent || !submit) return;
  form.action =
    'https://docs.google.com/forms/d/e/1FAIpQLSc90Wm3r2-JLs0ZUNT6BNJChr2zJv4ZKUJRZbKQCMoAKA1s6Q/formResponse';
  form.method = 'post';
  form.target = '_blank';
  form.rel = 'noopener noreferrer';
  name.required = true;
  name.autocomplete = 'name';
  name.maxLength = 60;
  phone.required = true;
  phone.autocomplete = 'tel';
  consent.required = true;
  scope.on(consent, 'change', () => {
    submit.disabled = !consent.checked;
  });
  scope.on(phone, 'input', () => {
    phone.setCustomValidity('');
    const before = phone.value;
    const caretAtEnd = phone.selectionEnd === before.length;
    const digits = before.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length >= 4 && digits.length < 7)
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    else if (digits.length >= 7 && digits.length < 11)
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    else if (digits.length === 11)
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    if (formatted !== before) {
      phone.value = formatted;
      if (caretAtEnd) phone.setSelectionRange(formatted.length, formatted.length);
    }
  });
  scope.on(name, 'input', () => name.setCustomValidity(''));
  scope.on<SubmitEvent>(form, 'submit', (event) => {
    const invalid = !name.value.trim()
      ? name
      : phone.value.replace(/\D/g, '').length < 10
        ? phone
        : !consent.checked
          ? consent
          : null;
    if (invalid) {
      event.preventDefault();
      invalid.setCustomValidity(
        invalid === phone ? '연락처를 정확하게 입력해 주세요.' : '필수 정보를 입력해 주세요.',
      );
      invalid.reportValidity();
      invalid.focus();
      invalid.classList.add('border-red-500');
      scope.later(() => invalid.classList.remove('border-red-500'), 2000);
      return;
    }
    name.value = name.value.trim();
    // A cross-origin form cannot confirm receipt; the new tab owns its result.
    if (thankyou) {
      const heading = thankyou.querySelector('h3');
      const description = thankyou.querySelector('p');
      if (heading) heading.textContent = '신청 정보를 전송했습니다';
      if (description)
        description.textContent =
          '새 탭의 Google 양식에서 접수 결과를 확인해 주세요. 접수가 어렵다면 카카오톡 상담을 이용해 주세요.';
      form.classList.add('hidden');
      thankyou.classList.remove('hidden');
      thankyou.setAttribute('role', 'status');
    }
  });
}

function attachRotation(scope: Scope) {
  if (scope.reduced) return;
  const image = scope.query<HTMLImageElement>('#team-influencer-img');
  if (image) {
    const sources = ['team-influencer-3.jpg', 'team-influencer-5.jpg', 'location-3.jpg'];
    let index = 0;
    scope.every(() => {
      index = (index + 1) % sources.length;
      image.style.opacity = '0';
      scope.later(() => {
        image.src = sourceImageUrls[sources[index] as SourceImageName];
        image.style.opacity = '1';
      }, 500);
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
  attachReveals(scope);
  attachPointerEffects(scope);
  attachNavigation(scope);
  attachModals(scope);
  attachLeadForm(scope);
  attachRotation(scope);
  attachSourceIndicators(scope);
  scope.cleanup(attachSourceRadar(root, scope.reduced));
  return scope.dispose;
}
