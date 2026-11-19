/**
 * Helios Frame · Dinamik tema motoru.
 *
 * project.config.json -> theme bölümünü CSS değişkenlerine çevirir:
 *   colors.brand        -> --hf-brand   (tüm turuncu tonları buradan OKLCH ile türetilir)
 *   components.card.radius -> --hf-card-radius
 * Marka rengine göre üstündeki yazı rengi (beyaz/koyu) WCAG kontrastıyla otomatik seçilir.
 * Uygulanan değerler localStorage'a yazılır; theme-boot.js sonraki açılışta ilk boyamadan
 * önce bunları uygular (renk sıçraması / FOUC olmaz).
 */

const MODE_KEY = 'hf-theme-mode';
const WIDTH_KEY = 'hf-width';

/** İçerik genişliği hazır değerleri. Bunların dışında geçerli her CSS uzunluğu kabul edilir (ör. "1440px", "92vw"). */
export const WIDTH_PRESETS = Object.freeze({ full: '100%', wide: '1600px', normal: '1280px', narrow: '1024px' });
const VARS_KEY = 'hf-theme-vars';
const COLOR_VARS = {
  brand: '--hf-brand', accent: '--hf-accent', onBrand: '--hf-on-brand',
  success: '--hf-success', warning: '--hf-warning', danger: '--hf-danger', info: '--hf-info',
  navBg: '--hf-nav-bg', navText: '--hf-nav-text',
};
const DARK_TEXT = '#1c1f22';
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/[^a-z0-9-]/g, '');
const UNSAFE = /[;{}<>\\]|\/\*|url\s*\(|expression/i;

const isColor = (v) => typeof v === 'string' && (globalThis.CSS?.supports?.('color', v) ?? /^#[0-9a-f]{3,8}$/i.test(v));
const isSafeValue = (v) => (typeof v === 'string' || typeof v === 'number') && String(v).length < 200 && !UNSAFE.test(String(v));

/** "wide" -> "1600px", "1440px" -> "1440px", geçersiz -> null */
export function resolveWidth(width) {
  if (width == null || width === '') return null;
  if (Object.hasOwn(WIDTH_PRESETS, width)) return WIDTH_PRESETS[width];
  const s = String(width).trim();
  if (!isSafeValue(s)) return null;
  const ok = globalThis.CSS?.supports?.('width', s) ?? /^\d+(?:\.\d+)?(?:px|rem|em|vw|%)$/.test(s);
  return ok && !/^-/.test(s) ? s : null;
}

/** "#f47b20" / "rgb(...)" -> [r,g,b] (0-255). Okunamazsa null. */
export function parseColor(value) {
  const v = String(value).trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(v);
  if (m) return m.slice(1, 4).map(Number);
  if (typeof document !== 'undefined' && isColor(v)) {
    // Diğer biçimler (oklch, hsl, isimli renk) için tarayıcıya hesaplat
    const probe = document.createElement('i');
    probe.style.color = v;
    document.body?.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    const r = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(c);
    if (r) return r.slice(1, 4).map(Number);
  }
  return null;
}

const luminance = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Verilen zemin rengine en okunur yazı rengini döndürür. */
export function readableOn(color) {
  const rgb = parseColor(color);
  if (!rgb) return '#ffffff';
  return contrast(rgb, [255, 255, 255]) >= contrast(rgb, parseColor(DARK_TEXT)) ? '#ffffff' : DARK_TEXT;
}

/** Tema nesnesini CSS değişkenlerine çevirir (saf fonksiyon, test edilebilir). */
export function themeToVars(theme = {}, { width } = {}) {
  const vars = {};
  const w = resolveWidth(width);
  if (w) vars['--hf-container'] = w;
  const colors = theme.colors ?? {};
  for (const [k, name] of Object.entries(COLOR_VARS)) {
    if (isColor(colors[k])) vars[name] = colors[k];
  }
  if (vars['--hf-brand'] && !colors.onBrand) vars['--hf-on-brand'] = readableOn(vars['--hf-brand']);

  if (isSafeValue(theme.radius)) {
    const r = parseFloat(theme.radius);
    const unit = String(theme.radius).replace(/[\d.\s-]/g, '') || 'px';
    if (!Number.isNaN(r)) {
      vars['--hf-radius-sm'] = `${Math.round(r * 0.6)}${unit}`;
      vars['--hf-radius'] = `${r}${unit}`;
      vars['--hf-radius-lg'] = `${Math.round(r * 1.4)}${unit}`;
      vars['--hf-radius-xl'] = `${Math.round(r * 2)}${unit}`;
    }
  }
  if (isSafeValue(theme.font)) vars['--hf-font-sans'] = theme.font;

  for (const [comp, props] of Object.entries(theme.components ?? {})) {
    if (!props || typeof props !== 'object') continue;
    for (const [prop, value] of Object.entries(props)) {
      if (isSafeValue(value)) vars[`--hf-${kebab(comp)}-${kebab(prop)}`] = String(value);
    }
  }
  return vars;
}

let current = { mode: 'auto' };
let mql = null;

function resolveMode(mode) {
  if (mode === 'dark' || mode === 'light') return mode;
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function storageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function storageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* yok say */ } }

/**
 * Temayı uygular. root: genellikle document.documentElement
 * layout.width verilirse içerik genişliği de ayarlanır; kullanıcının kayıtlı tercihi önceliklidir.
 */
export function applyTheme(theme = {}, root = document.documentElement, { width } = {}) {
  const vars = themeToVars(theme, { width: storageGet(WIDTH_KEY) || width });
  // Daha önce uygulanmış ama artık olmayan değişkenleri temizle
  let previous = {};
  try { previous = JSON.parse(storageGet(VARS_KEY) || '{}') || {}; } catch { previous = {}; }
  for (const name of Object.keys(previous)) {
    if (!(name in vars)) root.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  storageSet(VARS_KEY, JSON.stringify(vars));

  if (theme.density === 'compact') root.dataset.density = 'compact';
  else delete root.dataset.density;

  const userMode = storageGet(MODE_KEY);
  setMode(userMode || theme.mode || 'auto', { persist: false, root });
  return vars;
}

/** Kullanıcının içerik genişliği tercihi (full | wide | normal | narrow | CSS değeri). null: config'e dön. */
export function setWidth(width, { persist = true, fallback = null, root = document.documentElement } = {}) {
  if (width == null) {
    try { localStorage.removeItem(WIDTH_KEY); } catch { /* yok say */ }
    width = fallback;
  }
  const v = resolveWidth(width);
  if (!v) return null;
  root.style.setProperty('--hf-container', v);
  if (persist && width !== fallback) storageSet(WIDTH_KEY, String(width));
  // theme-boot.js sonraki açılışta ilk boyamadan önce uygulasın
  let cache = {};
  try { cache = JSON.parse(storageGet(VARS_KEY) || '{}') || {}; } catch { cache = {}; }
  cache['--hf-container'] = v;
  storageSet(VARS_KEY, JSON.stringify(cache));
  root.dispatchEvent(new CustomEvent('hf:width', { detail: { width, value: v } }));
  return v;
}

export const getWidth = () => storageGet(WIDTH_KEY);

/** light | dark | auto */
export function setMode(mode, { persist = true, root = document.documentElement } = {}) {
  current.mode = ['light', 'dark', 'auto'].includes(mode) ? mode : 'auto';
  root.dataset.theme = resolveMode(current.mode);
  if (persist) storageSet(MODE_KEY, current.mode);

  mql?.removeEventListener?.('change', onSystemChange);
  if (current.mode === 'auto' && globalThis.matchMedia) {
    mql = matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', onSystemChange);
  }
  // Mobil tarayıcı adres çubuğu rengi
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = root.dataset.theme === 'dark' ? '#121416' : '#ffffff';
  root.dispatchEvent(new CustomEvent('hf:theme', { detail: { mode: current.mode, resolved: root.dataset.theme } }));
}

function onSystemChange() {
  if (current.mode === 'auto') setMode('auto', { persist: false });
}

export const getMode = () => current.mode;

export function toggleMode(root = document.documentElement) {
  setMode(root.dataset.theme === 'dark' ? 'light' : 'dark', { root });
}
