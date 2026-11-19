/**
 * Helios Frame · Uygulama başlatıcı.
 *
 * Her sayfaya tek satır eklenir:
 *   <script type="module" src="/core/app.js"></script>
 * Sayfaya özel kod ise hazır olan uygulama bağlamını bekler:
 *   import { ready } from '/core/app.js';
 *   const app = await ready;   // { config, t, label, fmt, store, bus, http, data, url, user, ... }
 *
 * Akış: config yükle -> tema uygula -> dil/biçim -> kullanıcı -> bileşenleri tanımla -> hydrate.
 */
import { loadConfig, url, ROOT } from './config.js';
import { applyTheme } from './theme.js';
import { createI18n } from './i18n.js';
import { createFormat } from './format.js';
import { createStore } from './store.js';
import { createBus } from './bus.js';
import { createHttp } from './http.js';
import { enhanceForm } from './validate.js';
import { setVar, $$ } from './dom.js';
import { setMeta, jsonLd, organizationSchema } from './seo.js';

export const VERSION = '2.0.0';

/** Rolü yetkili mi? (yalnızca arayüz gösterimi içindir; yetki kontrolü sunucuda yapılır) */
export function hasRole(user, roles) {
  if (!roles || roles.length === 0) return true;
  const mine = user?.roles ?? [];
  return roles.some((r) => mine.includes(r));
}

async function loadUser(config, http) {
  if (config.auth?.meEndpoint) {
    try { return await http.get(config.auth.meEndpoint); } catch { return null; }
  }
  return config.auth?.demoUser ?? null;
}

/** data-hf-value="3.5" -> CSS değişkeni --_v (CSP: style="" özniteliği kullanılmaz) */
function hydrate(root, app) {
  for (const el of $$('[data-hf-value]', root)) {
    const v = el.dataset.hfValue;
    setVar(el, '--_v', el.classList.contains('hf-progress') || el.closest('.hf-progress') ? `${parseFloat(v)}%` : v);
  }
  for (const form of $$('form[data-hf-validate]', root)) {
    if (!form.__hf) { form.__hf = true; enhanceForm(form, { t: app.t }); }
  }
}

async function boot() {
  const config = await loadConfig();
  const root = document.documentElement;

  applyTheme(config.theme, root);
  if (!root.lang) root.lang = config.locale.split('-')[0];

  const { t, label, lang } = createI18n({ locale: config.locale, ...config.i18n });
  const fmt = createFormat({ locale: config.locale, currency: config.currency, timezone: config.timezone });
  const bus = createBus();
  const http = createHttp({
    ...config.api,
    onUnauthorized: () => {
      bus.emit('auth:unauthorized');
      if (config.auth?.loginUrl) location.assign(url(config.auth.loginUrl));
    },
  });
  /** Framework'e ait statik JSON (data/, config/) için ayrı istemci */
  const data = createHttp({ baseURL: ROOT.href, retries: 1 });
  const store = createStore(
    { user: null, cart: [] },
    { persist: { key: `hf:${config.name}`, keys: ['cart'], version: 1 } },
  );

  const app = {
    VERSION, config, t, label, lang, fmt, bus, http, data, store, url,
    get user() { return store.state.user; },
    can: (roles) => hasRole(store.state.user, roles),
    hydrate: (el = document) => hydrate(el, app),
  };
  instance = app;
  context.resolve(app);

  store.state.user = await loadUser(config, http);

  // Bileşenleri tanımla (her biri yalnızca bir kez kaydolur)
  await import('../components/index.js');

  hydrate(document, app);

  // Organizasyon JSON-LD (config'de tanımlıysa, sayfada yoksa)
  if (config.seo?.organization && !document.querySelector('script[type="application/ld+json"]#hf-org')) {
    jsonLd(organizationSchema(config.seo.organization), 'hf-org');
  }
  // <meta name="description"> yoksa config'deki varsayılanı yaz
  if (!document.querySelector('meta[name="description"]') && config.seo?.description) {
    setMeta({ description: config.seo.description }, config.seo);
  }
  root.classList.add('hf-ready');
  bus.emit('app:ready', app);
  return app;
}

/** Çalışan uygulama (canlı bağlama: bileşenler import edip doğrudan okur). */
export let instance = null;

/** Bileşenlerin döngüsel import olmadan bağlama erişmesi için paylaşılan söz (promise). */
export const context = (() => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
})();

/** Tamamen hazır (bileşenler tanımlı, kullanıcı yüklü) uygulama. */
export const ready = typeof document === 'undefined'
  ? new Promise(() => {}) // Node (prerender/test): modüller içe aktarılabilir, uygulama başlamaz
  : boot().catch((err) => {
    console.error('[helios] başlatılamadı', err);
    throw err;
  });
