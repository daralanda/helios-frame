/**
 * Helios Frame · Proje yapılandırması.
 *
 * Her proje yalnızca config/project.config.json ve config/menu.json dosyalarını değiştirir.
 * Yüklenen ayar varsayılanlarla derin birleştirilir ve dondurulur (çalışma anında değiştirilemez).
 */

/** Framework kök adresi (core/ klasörünün bir üstü). Alt klasöre kurulumda da doğru çalışır. */
export const ROOT = new URL('../', import.meta.url);

/** Köke göre yol üretir: url('assets/icons.svg') -> '/helios-frame/assets/icons.svg' */
export function url(path = '') {
  const s = String(path);
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(s)) return s; // mutlak adres veya çapa
  const u = new URL(s.replace(/^\//, ''), ROOT);
  return u.pathname + u.search + u.hash;
}

export const DEFAULTS = Object.freeze({
  name: 'Helios Frame',
  locale: 'tr-TR',
  currency: 'TRY',
  timezone: 'Europe/Istanbul',
  brand: { name: 'Helios', logo: 'assets/img/logo.svg', home: './' },
  theme: {
    mode: 'auto',            // light | dark | auto
    density: 'comfortable',  // comfortable | compact
    colors: {},              // brand, accent, success, ... (CSS renk değerleri)
    radius: null,            // ör. "12px" -> tüm köşe ölçeği bu değere göre
    font: null,              // ör. "\"Plus Jakarta Sans\", sans-serif"
    components: {},          // { card: { radius: "18px", shadow: "none" } } -> --hf-card-radius
  },
  layout: {
    nav: 'vertical',         // vertical | horizontal | both
    collapsible: true,
    search: false,
    themeToggle: true,
    footer: true,
  },
  menu: 'config/menu.json',  // dosya yolu veya doğrudan menü nesnesi
  api: { baseURL: '', timeout: 15000, csrf: { meta: 'csrf-token', cookie: 'XSRF-TOKEN', header: 'X-XSRF-TOKEN' } },
  auth: { meEndpoint: null, demoUser: null, loginUrl: null },
  i18n: { fallback: 'tr', messages: {} },
  seo: { siteName: '', titleTemplate: '%s', defaultImage: null, twitter: null, organization: null },
});

const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Prototip kirliliğine (prototype pollution) kapalı derin birleştirme. */
export function deepMerge(target, source) {
  const out = Array.isArray(target) ? [...target] : { ...target };
  if (!isObj(source)) return out;
  for (const key of Object.keys(source)) {
    if (BLOCKED.has(key)) continue;
    const s = source[key];
    out[key] = isObj(s) && isObj(out[key]) ? deepMerge(out[key], s) : s;
  }
  return out;
}

export function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const v of Object.values(obj)) deepFreeze(v);
  }
  return obj;
}

async function fetchJson(path) {
  const res = await fetch(new URL(path, ROOT), { credentials: 'same-origin', cache: 'no-cache' });
  if (!res.ok) throw new Error(`Yapılandırma okunamadı: ${path} (${res.status})`);
  return res.json();
}

/**
 * Yapılandırmayı yükler. Kaynak sırası:
 * 1) <meta name="hf-config" content="config/baska.json"> (sayfa bazında farklı proje)
 * 2) config/project.config.json
 * Sayfa, <html data-nav="horizontal"> gibi özniteliklerle layout'u ezebilir.
 */
export async function loadConfig() {
  const meta = document.querySelector('meta[name="hf-config"]')?.content;
  let user = {};
  try {
    user = await fetchJson(meta || 'config/project.config.json');
  } catch (err) {
    console.warn('[config]', err.message, '- varsayılanlar kullanılıyor.');
  }
  let cfg = deepMerge(DEFAULTS, user);
  if (typeof cfg.menu === 'string') {
    try { cfg = { ...cfg, menu: await fetchJson(cfg.menu) }; } catch (err) {
      console.warn('[config] menü okunamadı:', err.message);
      cfg = { ...cfg, menu: { menus: {} } };
    }
  }
  return deepFreeze(cfg);
}
