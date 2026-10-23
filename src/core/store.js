/**
 * Küçük, localStorage destekli durum yöneticisi.
 *
 * Kurallar:
 *  - State değişmez (immutable) kabul edilir: nesneleri/dizileri yerinde değiştirmeyin,
 *    yenisini üretip store.set({...}) ile verin.
 *  - subscribe(fn, selector): yalnızca seçilen değer değiştiğinde (Object.is) çağrılır.
 *  - persistKeys: yalnızca bu anahtarlar localStorage'a yazılır. `version` değişirse eski veri atılır.
 *  - Aynı sitenin farklı sekmeleri `storage` olayıyla senkron kalır.
 */
export class Store {
  #state;
  #subs = new Set();
  #opts;

  constructor(initial = {}, opts = {}) {
    this.#opts = { persistKey: null, persistKeys: null, version: 1, ...opts };
    this.#state = { ...initial, ...this.#read() };

    if (this.#opts.persistKey && typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === this.#opts.persistKey) this.#sync();
      });
    }
  }

  get state() { return this.#state; }

  /** patch: nesne ya da (state) => nesne */
  set(patch) {
    const next = typeof patch === 'function' ? patch(this.#state) : patch;
    this.#state = { ...this.#state, ...next };
    this.#write();
    this.#notify();
  }

  /** Dönen fonksiyonu çağırarak aboneliği iptal edin. */
  subscribe(fn, selector = (s) => s) {
    const sub = { fn, selector, last: selector(this.#state) };
    this.#subs.add(sub);
    return () => this.#subs.delete(sub);
  }

  #notify() {
    for (const sub of [...this.#subs]) {
      const next = sub.selector(this.#state);
      if (!Object.is(next, sub.last)) {
        const prev = sub.last;
        sub.last = next;
        try { sub.fn(next, prev); } catch (err) { console.error('[store] abone hatası', err); }
      }
    }
  }

  #read() {
    const { persistKey, persistKeys, version } = this.#opts;
    if (!persistKey) return {};
    try {
      const parsed = JSON.parse(localStorage.getItem(persistKey));
      if (!parsed || parsed.v !== version) return {};
      const data = parsed.data ?? {};
      if (!persistKeys) return data;
      return Object.fromEntries(persistKeys.filter((k) => k in data).map((k) => [k, data[k]]));
    } catch {
      return {};
    }
  }

  #write() {
    const { persistKey, persistKeys, version } = this.#opts;
    if (!persistKey) return;
    const keys = persistKeys ?? Object.keys(this.#state);
    const data = Object.fromEntries(keys.map((k) => [k, this.#state[k]]));
    try {
      localStorage.setItem(persistKey, JSON.stringify({ v: version, data }));
    } catch {
      /* kota dolu / özel mod: sessizce geç */
    }
  }

  #sync() {
    this.#state = { ...this.#state, ...this.#read() };
    this.#notify();
  }
}
