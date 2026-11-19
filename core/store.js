/**
 * Helios Frame · Reaktif durum deposu (Proxy tabanlı, bağımlılıksız).
 *
 *   const store = createStore({ cart: [] }, { persist: { key: 'hf-shop', keys: ['cart'] } });
 *   store.state.cart = [...store.state.cart, item];      // doğrudan atama
 *   store.update('cart', (c) => c.filter(...));           // fonksiyonel güncelleme
 *   const off = store.subscribe((state, changed) => ..., ['cart']);
 *
 * Değişiklikler mikro görevde toplanır (batch); aynı tick'teki 10 atama tek bildirim üretir.
 * Kalıcılık yalnızca belirtilen anahtarlar içindir. Token, parola gibi hassas veriler
 * buraya YAZILMAMALIDIR (localStorage XSS'e açıktır; oturum HttpOnly cookie ile yönetilmeli).
 */

const BLOCKED = new Set(['__proto__', 'constructor', 'prototype']);

export function createStore(initial = {}, { persist = null, storage = safeStorage() } = {}) {
  const data = Object.assign(Object.create(null), structuredClone(initial));
  const subs = new Set();
  const changed = new Set();
  let scheduled = false;

  if (persist && storage) {
    try {
      const saved = JSON.parse(storage.getItem(persist.key) ?? 'null');
      if (saved && saved.v === (persist.version ?? 1) && saved.d && typeof saved.d === 'object') {
        for (const k of persist.keys ?? Object.keys(saved.d)) {
          if (!BLOCKED.has(k) && k in saved.d) data[k] = saved.d[k];
        }
      }
    } catch { /* bozuk kayıt: varsayılanla devam */ }
  }

  const save = () => {
    if (!persist || !storage) return;
    const d = {};
    for (const k of persist.keys ?? Object.keys(data)) d[k] = data[k];
    try { storage.setItem(persist.key, JSON.stringify({ v: persist.version ?? 1, d })); } catch { /* kota dolu */ }
  };

  const flush = () => {
    scheduled = false;
    const keys = [...changed];
    changed.clear();
    for (const sub of subs) {
      if (!sub.keys || sub.keys.some((k) => keys.includes(k))) {
        try { sub.fn(state, keys); } catch (err) { console.error('[store] abone hatası', err); }
      }
    }
    if (persist && keys.some((k) => !persist.keys || persist.keys.includes(k))) save();
  };

  const mark = (key) => {
    changed.add(key);
    if (!scheduled) { scheduled = true; queueMicrotask(flush); }
  };

  const state = new Proxy(data, {
    set(target, key, value) {
      if (typeof key !== 'string' || BLOCKED.has(key)) return false;
      if (Object.is(target[key], value)) return true;
      target[key] = value;
      mark(key);
      return true;
    },
    deleteProperty(target, key) {
      if (key in target) { delete target[key]; mark(key); }
      return true;
    },
  });

  return {
    state,
    get: (key) => data[key],
    set(key, value) { state[key] = value; },
    update(key, fn) { state[key] = fn(data[key]); },
    /** fn(state, değişenAnahtarlar); keys verilirse yalnızca o anahtarlarda tetiklenir. */
    subscribe(fn, keys = null) {
      const sub = { fn, keys };
      subs.add(sub);
      return () => subs.delete(sub);
    },
    snapshot: () => structuredClone({ ...data }),
  };
}

function safeStorage() {
  try {
    const s = globalThis.localStorage;
    const k = '__hf_test__';
    s.setItem(k, '1'); s.removeItem(k);
    return s;
  } catch {
    return null; // gizli mod / devre dışı depolama
  }
}
