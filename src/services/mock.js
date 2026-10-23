/**
 * Mock yardımcıları (config.api.mock = true iken).
 *  - mockData(name): data/<name>.json dosyasını bir kez okur, önbellekler.
 *  - localDb(key):   POST benzeri yazmalar için localStorage tabanlı mini "tablo".
 * Gerçek API'ye geçince servislerdeki `if (this.mock)` dalları kullanılmaz; arayüz koduna dokunmanız gerekmez.
 */
import { config } from '../config.js';
import { sleep } from '../core/dom.js';

const cache = new Map();

export function mockData(name) {
  if (!cache.has(name)) {
    const url = new URL(`data/${name}.json`, document.baseURI);
    // İptal sinyali bilerek geçilmez: paylaşılan önbellek Promise'i tek bir bileşenin iptaliyle bozulmasın.
    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Mock veri okunamadı: data/${name}.json (${res.status})`);
        return res.json();
      })
      .catch((err) => { cache.delete(name); throw err; });
    cache.set(name, promise);
  }
  return cache.get(name).then(async (data) => {
    await sleep(config.api.mockDelay);
    return structuredClone(data);
  });
}

export function localDb(table) {
  const key = `${config.storage.prefix}${table}`;
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key)) ?? []; } catch { return []; }
  };
  return {
    all: read,
    insert(row) {
      const rows = [row, ...read()];
      try { localStorage.setItem(key, JSON.stringify(rows)); } catch { /* kota */ }
      return row;
    },
  };
}
