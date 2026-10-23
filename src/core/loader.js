/**
 * Harici script/stil yükleyici (CDN veya yerel).
 * Kayıt defteri için bkz. src/libs.js
 */
const inflight = new Map();

function injectScript(src) {
  if (inflight.has(src)) return inflight.get(src);
  const promise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false; // eklenme sırası = çalışma sırası (örn. DataTables çekirdek -> Bootstrap eklentisi)
    el.onload = () => resolve();
    el.onerror = () => {
      inflight.delete(src);
      el.remove();
      reject(new Error(`Script yüklenemedi: ${src}`));
    };
    document.head.append(el);
  });
  inflight.set(src, promise);
  return promise;
}

function injectStyle(href) {
  if (inflight.has(href)) return inflight.get(href);
  const promise = new Promise((resolve, reject) => {
    const el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    el.onload = () => resolve();
    el.onerror = () => {
      inflight.delete(href);
      el.remove();
      reject(new Error(`Stil yüklenemedi: ${href}`));
    };
    // helios.css'ten ÖNCE ekle: marka stilleri kütüphane stillerini ezebilsin.
    const brand = document.querySelector('link[href*="helios.css"]');
    document.head.insertBefore(el, brand);
  });
  inflight.set(href, promise);
  return promise;
}

export class LibraryLoader {
  #registry;
  #mode;
  #loaded = new Map();

  constructor(registry, mode = 'cdn') {
    this.#registry = registry;
    this.#mode = mode;
  }

  /** load('chartjs', 'datatables') veya load(['chartjs']) */
  async load(...names) {
    await Promise.all(names.flat().filter(Boolean).map((name) => this.#loadOne(name)));
  }

  #loadOne(name) {
    if (this.#loaded.has(name)) return this.#loaded.get(name);

    const def = this.#registry[name];
    if (!def) return Promise.reject(new Error(`Bilinmeyen kütüphane: "${name}" (src/libs.js)`));

    const promise = (async () => {
      // Sayfada zaten varsa (kendi <script> etiketiniz vb.) tekrar yükleme -> sürüm çakışması olmaz.
      if (def.global && globalThis[def.global]) return globalThis[def.global];

      await this.load(def.deps ?? []);
      const source = def[this.#mode] ?? def.cdn ?? {};
      await Promise.all((source.css ?? []).map(injectStyle));
      for (const url of source.js ?? []) await injectScript(url);
      return def.global ? globalThis[def.global] : undefined;
    })();

    this.#loaded.set(name, promise);
    promise.catch(() => this.#loaded.delete(name)); // hata sonrası yeniden denenebilsin
    return promise;
  }
}
