/**
 * Helios Frame · Olay veri yolu (bileşenler arası gevşek bağlı iletişim).
 *   bus.on('cart:add', (p) => ...);  bus.emit('cart:add', product);
 */
export function createBus() {
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type)?.delete(fn);
    },
    once(type, fn) {
      const off = this.on(type, (p) => { off(); fn(p); });
      return off;
    },
    emit(type, payload) {
      for (const fn of [...(map.get(type) ?? [])]) {
        try { fn(payload); } catch (err) { console.error(`[bus] ${type}`, err); }
      }
    },
  };
}
