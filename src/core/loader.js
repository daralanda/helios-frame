/**
 * Harici script/stil yükleyici (Next.js'teki <Script> mantığının statik karşılığı).
 *
 * Bir kütüphane iki şekilde referans verilir:
 *   1) Satır içi (önerilen, ihtiyaç duyulan yerde):
 *        static libs = [{ name: 'chartjs', global: 'Chart', js: ['https://.../chart.umd.js'] }];
 *        await ctx.loader.load({ global: 'Chart', js: ['https://...'] });
 *   2) Adıyla (src/libs.js kayıt defterinde tanımlıysa):
 *        static libs = ['chartjs'];
 *
 * Tanım alanları: { name?, global?, deps?: (ad|tanım)[], css?: [], js?: [] }
 * Kayıt defteri girdilerinde ayrıca `cdn` / `local` ayrımı yapılabilir (libMode'a göre seçilir).
 *
 * Garantiler: aynı kütüphane bir kez yüklenir · `global` sayfada zaten varsa yüklenmez ·
 * `deps` önce yüklenir · hata sonrası yeniden denenebilir.
 */
const inflight = new Map();

function injectScript(src) {
  if (inflight.has(src)) return inflight.get(src);
  const promise = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = false; // eklenme sırası = çalışma sırası
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

  constructor(registry = {}, mode = 'cdn') {
    this.#registry = registry;
    this.#mode = mode;
  }

  /** load('ad') · load({ js: [...] }) · load('a', { js: [...] }) · load([...]) */
  async load(...items) {
    await Promise.all(items.flat().filter(Boolean).map((item) => this.#loadOne(item)));
  }

  #loadOne(item) {
    const isName = typeof item === 'string';
    const def = isName ? this.#registry[item] : item;
    if (!def) return Promise.reject(new Error(`Bilinmeyen kütüphane: "${item}" (src/libs.js ya da satır içi tanım kullanın)`));

    const key = isName ? item : (def.name ?? def.global ?? def.js?.[0] ?? def.css?.[0]);
    if (!key) return Promise.reject(new Error('Kütüphane tanımında name, global, js veya css gerekli'));
    if (this.#loaded.has(key)) return this.#loaded.get(key);

    const promise = (async () => {
      // Sayfada zaten varsa (kendi <script> etiketiniz vb.) tekrar yükleme -> sürüm çakışması olmaz.
      if (def.global && globalThis[def.global]) return globalThis[def.global];

      await this.load(def.deps ?? []);
      const source = def[this.#mode] ?? def.cdn ?? def; // satır içi tanımda alanlar doğrudan def üzerinde
      await Promise.all((source.css ?? []).map(injectStyle));
      for (const url of source.js ?? []) await injectScript(url);
      return def.global ? globalThis[def.global] : undefined;
    })();

    this.#loaded.set(key, promise);
    promise.catch(() => this.#loaded.delete(key)); // hata sonrası yeniden denenebilsin
    return promise;
  }
}
