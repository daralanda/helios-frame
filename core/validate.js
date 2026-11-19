/**
 * Helios Frame · Form doğrulama ve giriş maskeleri.
 *
 * HTML ile bildirimsel kullanım (JS yazmadan):
 *   <form data-hf-validate novalidate>
 *     <div class="hf-field">
 *       <label class="hf-label" for="tel">Telefon</label>
 *       <input class="hf-input" id="tel" name="tel" required data-rule="phone" data-mask="phone">
 *     </div>
 *
 * Kurallar: required (öznitelik), minlength/maxlength/min/max/pattern (native),
 * data-rule="email|phone|iban|tckn|vkn", data-match="#parola"
 *
 * NOT: İstemci doğrulaması yalnızca kullanıcı deneyimi içindir. Aynı kurallar
 * sunucuda MUTLAKA tekrar uygulanmalıdır.
 */

/* ---------------- Saf doğrulayıcılar (test edilebilir) ---------------- */

export const validators = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
  /** Türkiye cep/sabit: 05xx xxx xx xx, +90..., 0212... */
  phone: (v) => /^(?:\+?90|0)?[2-5]\d{9}$/.test(v.replace(/[\s()-]/g, '')),
  /** TR IBAN: TR + 24 hane, ISO 13616 mod-97 kontrolü */
  iban(v) {
    const s = v.replace(/\s/g, '').toUpperCase();
    if (!/^TR\d{24}$/.test(s)) return false;
    const re = s.slice(4) + s.slice(0, 4);
    const digits = re.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
    let rem = 0;
    for (const d of digits) rem = (rem * 10 + Number(d)) % 97;
    return rem === 1;
  },
  /** T.C. Kimlik No algoritması */
  tckn(v) {
    if (!/^[1-9]\d{10}$/.test(v)) return false;
    const d = [...v].map(Number);
    const odd = d[0] + d[2] + d[4] + d[6] + d[8];
    const even = d[1] + d[3] + d[5] + d[7];
    const d10 = (((odd * 7 - even) % 10) + 10) % 10;
    const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
    return d[9] === d10 && d[10] === d11;
  },
  /** Vergi Kimlik No (10 hane) algoritması */
  vkn(v) {
    if (!/^\d{10}$/.test(v)) return false;
    const d = [...v].map(Number);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const t = (d[i] + 9 - i) % 10;
      let p = (t * 2 ** (9 - i)) % 9;
      if (t !== 0 && p === 0) p = 9;
      sum += p;
    }
    return (10 - (sum % 10)) % 10 === d[9];
  },
};

/* ---------------- Maskeler ---------------- */

export const masks = {
  phone(v) {
    const d = v.replace(/\D/g, '').replace(/^90/, '').slice(0, 11);
    const n = d.startsWith('0') ? d : d ? `0${d}`.slice(0, 11) : '';
    return [n.slice(0, 4), n.slice(4, 7), n.slice(7, 9), n.slice(9, 11)].filter(Boolean).join(' ');
  },
  iban(v) {
    const s = v.replace(/[^0-9a-z]/gi, '').toUpperCase().slice(0, 26);
    return s.replace(/(.{4})/g, '$1 ').trim();
  },
  digits: (v) => v.replace(/\D/g, ''),
  card(v) { return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '); },
};

/* ---------------- DOM entegrasyonu ---------------- */

function fieldError(input, t) {
  const v = input.value.trim();
  const vs = input.validity;
  if (vs.valueMissing || (input.required && v === '')) return t('form.required');
  if (v === '') return '';
  if (vs.typeMismatch && input.type === 'email') return t('form.email');
  if (vs.tooShort) return t('form.min', { min: input.minLength });
  if (vs.tooLong) return t('form.max', { max: input.maxLength });
  if (vs.rangeUnderflow) return t('form.minValue', { min: input.min });
  if (vs.rangeOverflow) return t('form.maxValue', { max: input.max });
  if (vs.patternMismatch) return input.dataset.message || t('form.pattern');
  const rule = input.dataset.rule;
  if (rule && validators[rule] && !validators[rule](rule === 'phone' || rule === 'iban' ? v : v.replace(/\s/g, ''))) {
    return input.dataset.message || t(`form.${rule}`);
  }
  if (input.dataset.match) {
    const other = input.form?.querySelector(input.dataset.match);
    if (other && other.value !== input.value) return t('form.match');
  }
  if (input.minLength > 0 && v.length < input.minLength) return t('form.min', { min: input.minLength });
  return '';
}

function showError(input, message) {
  const field = input.closest('.hf-field') ?? input.parentElement;
  let el = field.querySelector(':scope > .hf-error');
  if (message) {
    if (!el) {
      el = document.createElement('p');
      el.className = 'hf-error';
      el.id = `${input.id || input.name}-error`;
      field.append(el);
    }
    el.textContent = message;
    input.setAttribute('aria-invalid', 'true');
    const ids = new Set((input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    ids.add(el.id);
    input.setAttribute('aria-describedby', [...ids].join(' '));
  } else {
    el?.remove();
    input.removeAttribute('aria-invalid');
  }
}

/**
 * Formu zenginleştirir. onSubmit(data, form) yalnızca form geçerliyse çağrılır.
 * Dönen fonksiyon dinleyicileri kaldırır.
 */
export function enhanceForm(form, { t = (k) => k, onSubmit = null } = {}) {
  form.noValidate = true;
  const fields = () => [...form.elements].filter((el) => el.matches('input, select, textarea') && !el.disabled && el.type !== 'hidden');

  const onInput = (e) => {
    const el = e.target;
    const mask = el.dataset?.mask;
    if (mask && masks[mask] && e.type === 'input') {
      const pos = el.selectionStart === el.value.length;
      el.value = masks[mask](el.value);
      if (pos) el.setSelectionRange(el.value.length, el.value.length);
    }
    // Hata gösterildiyse yazarken anlık düzelt; ilk hatayı ancak alandan çıkınca göster
    if (el.getAttribute?.('aria-invalid') === 'true' || e.type === 'focusout') {
      if (el.matches?.('input, select, textarea')) showError(el, fieldError(el, t));
    }
  };

  const onSubmitEvent = async (e) => {
    let first = null;
    for (const el of fields()) {
      const msg = fieldError(el, t);
      showError(el, msg);
      if (msg && !first) first = el;
    }
    if (first) {
      e.preventDefault();
      first.focus();
      form.dispatchEvent(new CustomEvent('hf:invalid', { bubbles: true }));
      return;
    }
    if (onSubmit) {
      e.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      submit?.setAttribute('aria-busy', 'true');
      try {
        await onSubmit(Object.fromEntries(new FormData(form)), form);
      } finally {
        submit?.removeAttribute('aria-busy');
      }
    }
  };

  form.addEventListener('input', onInput);
  form.addEventListener('focusout', onInput);
  form.addEventListener('submit', onSubmitEvent);
  return () => {
    form.removeEventListener('input', onInput);
    form.removeEventListener('focusout', onInput);
    form.removeEventListener('submit', onSubmitEvent);
  };
}
