/** Helios Frame · Bileşenler için ortak yardımcılar. */
import { instance } from '../core/app.js';
import { html } from '../core/dom.js';
import { url } from '../core/config.js';

/** Çalışan uygulama bağlamı (bileşenler tanımlandığında her zaman hazırdır). */
export const app = () => instance;

/** SVG sprite ikonu: icon('cart'), icon('x', 'hf-icon--sm') */
export function icon(name, cls = '') {
  return html`<svg class="hf-icon ${cls}" aria-hidden="true" focusable="false"><use href="${url('assets/icons.svg')}#i-${name}"></use></svg>`;
}

/** Bileşen taban sınıfı. Node'da (prerender/test) HTMLElement olmadığı için boş sınıfa düşer. */
export const HdElement = globalThis.HTMLElement ?? class {};

/** Custom element'i yalnızca bir kez kaydeder (tarayıcı dışında sessizce atlanır). */
export function define(name, cls) {
  if (globalThis.customElements && !customElements.get(name)) customElements.define(name, cls);
}

/** JSON özniteliğini güvenle okur. */
export function jsonAttr(el, name, fallback = null) {
  const v = el.getAttribute(name);
  if (!v) return fallback;
  try { return JSON.parse(v); } catch { console.warn(`[${el.localName}] ${name} geçersiz JSON`); return fallback; }
}
