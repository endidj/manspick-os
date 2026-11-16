// 상담·팀 모달과 폼 검증은 사용자가 처음 열 때 연결합니다.
import type { Scope } from './source-scope';

function createModal(scope: Scope, id: string, cancelPending: () => void) {
  const modal = scope.query(`#${id}`);
  let previousFocus: HTMLElement | null = null;
  let previousOverflow = '';
  let open = false;
  const close = () => {
    if (!open || !modal) return;
    open = false;
    cancelPending();
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
  return (trigger: HTMLElement) => {
    if (!modal || open) return;
    previousFocus = trigger;
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

export function createSourceModals(scope: Scope, cancelPending: () => void) {
  const openLead = createModal(scope, 'lead-modal', cancelPending);
  const openTeam = createModal(scope, 'team-modal', cancelPending);
  attachLeadForm(scope);
  return {
    async open(kind: 'lead' | 'team', trigger: HTMLElement, isCurrent: () => boolean) {
      if (kind === 'lead') {
        if (isCurrent()) openLead(trigger);
        return;
      }
      const { renderTeamGallery } = await import('./source-media-runtime');
      if (isCurrent() && renderTeamGallery(scope, trigger.dataset.team)) openTeam(trigger);
    },
  };
}
