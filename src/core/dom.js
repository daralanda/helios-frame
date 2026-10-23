/**
 * DOM yardımcıları: güvenli html`` şablon etiketi ve küçük araçlar.
 *
 * html`` içine yerleştirilen her değer otomatik HTML-escape edilir (XSS koruması).
 * İç içe html`` sonuçları ve dizileri (map çıktıları) olduğu gibi birleştirilir.
 */
export class SafeHtml {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Escape edilmeden eklenecek HTML. Yalnızca kendi ürettiğiniz, güvenli içerik için kullanın. */
export const raw = (value) => new SafeHtml(String(value ?? ''));

function toHtml(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(toHtml).join('');
  if (value === false || value == null) return '';
  return escapeHtml(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += toHtml(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function debounce(fn, wait = 250) {
  let timer;
  const wrapped = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const formatMoney = (amount, currency = 'TRY', locale = 'tr-TR') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount) || 0);

export const formatDate = (value, locale = 'tr-TR') =>
  value ? new Date(value).toLocaleDateString(locale) : '';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
