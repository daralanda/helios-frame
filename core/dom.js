/**
 * Helios Frame · DOM yardımcıları ve güvenli şablon motoru.
 *
 * Güvenlik kuralı: DOM'a HTML yalnızca render() ile yazılır ve render() yalnızca
 * html`` ile üretilmiş SafeHTML kabul eder. html`` içindeki tüm değerler otomatik
 * escape edilir; href/src/action özniteliklerindeki değerler ayrıca safeUrl()'den geçer.
 * Böylece kullanıcı/sunucu verisi ile XSS açığı oluşmaz.
 */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
const ESC_RE = /[&<>"'`]/g;
const URL_ATTR_RE = /\s(?:href|src|action|formaction|poster|xlink:href)\s*=\s*["']?$/i;
const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/** Metni HTML için güvenli hale getirir. */
export const escapeHTML = (value) => String(value ?? '').replace(ESC_RE, (c) => ESC[c]);

/** Yalnızca güvenli protokollere izin verir; aksi halde zararsız "#" döner. */
export function safeUrl(value) {
  const s = String(value ?? '').trim();
  if (s === '') return '#';
  // Göreli adresler (/, ./, ../, #, ?) güvenlidir
  if (/^(?:[/?#]|\.{1,2}\/)/.test(s) && !s.startsWith('//')) return s;
  try {
    const u = new URL(s, 'https://x.invalid/');
    if (u.origin === 'https://x.invalid') return s; // protokolsüz göreli yol (ör. "urun.html")
    return SAFE_PROTOCOLS.has(u.protocol) ? s : '#';
  } catch {
    return '#';
  }
}

/** Escape edilmiş ve güvenli kabul edilen HTML parçası. */
export class SafeHTML {
  constructor(value) { this.value = value; }
  toString() { return this.value; }
}

/**
 * Yalnızca GELİŞTİRİCİNİN yazdığı, sabit ve güvenilir HTML için.
 * Kullanıcı ya da API verisini ASLA raw() ile geçirmeyin.
 */
export const raw = (value) => new SafeHTML(String(value ?? ''));

function toHTML(value, inUrlAttr) {
  if (value == null || value === false) return '';
  if (value instanceof SafeHTML) return value.value;
  if (Array.isArray(value)) return value.map((v) => toHTML(v, false)).join('');
  return escapeHTML(inUrlAttr ? safeUrl(value) : value);
}

/** Etiketli şablon: html`<p>${kullaniciMetni}</p>` */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += toHTML(values[i], URL_ATTR_RE.test(strings[i])) + strings[i + 1];
  }
  return new SafeHTML(out);
}

// Trusted Types: CSP'de "require-trusted-types-for 'script'" açıksa tek yetkili politika budur.
let policy = null;
try {
  policy = globalThis.trustedTypes?.createPolicy?.('helios', {
    createHTML: (s) => s,          // yalnızca render() çağırır; girdi html`` ile escape edilmiştir
    createScript: (s) => s,        // yalnızca seo.jsonLd() çağırır; girdi serializeJsonLd() çıktısıdır
  }) ?? null;
} catch { policy = null; }

/** JSON-LD gibi çalıştırılmayan veri blokları için (Trusted Types uyumlu). */
export const trustedScript = (text) => (policy ? policy.createScript(text) : text);

/** Hedef elemanın içeriğini güvenli şablonla değiştirir. */
export function render(target, template) {
  if (!(template instanceof SafeHTML)) {
    throw new TypeError('render() yalnızca html`` şablonu kabul eder (XSS koruması).');
  }
  target.innerHTML = policy ? policy.createHTML(template.value) : template.value;
  return target;
}

/** Şablondan tek bir DOM düğümü (veya fragment) üretir. */
export function fragment(template) {
  const t = document.createElement('template');
  render(t, template);
  return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Olay delegasyonu: on(root, 'click', '[data-action]', (e, el) => ...)
 * Dönen fonksiyon dinleyiciyi kaldırır.
 */
export function on(root, type, selector, handler, options) {
  const fn = (e) => {
    const el = e.target instanceof Element ? e.target.closest(selector) : null;
    if (el && root.contains(el)) handler(e, el);
  };
  root.addEventListener(type, fn, options);
  return () => root.removeEventListener(type, fn, options);
}

/** CSP uyumlu CSS değişkeni atama (style="" özniteliği yerine CSSOM). */
export const setVar = (el, name, value) => el.style.setProperty(name, String(value));

export function debounce(fn, wait = 200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}

let uid = 0;
export const nextId = (prefix = 'hf') => `${prefix}-${(++uid).toString(36)}`;

/** Ekran okuyuculara kısa duyuru (aria-live). */
export function announce(message) {
  let region = document.getElementById('hf-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'hf-live';
    region.className = 'hf-sr-only';
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}
