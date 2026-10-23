/** Çok küçük bir olay yayıncısı (event bus). Bileşenler arası gevşek iletişim için. */
export class Emitter {
  #handlers = new Map();

  on(event, fn) {
    const set = this.#handlers.get(event) ?? new Set();
    set.add(fn);
    this.#handlers.set(event, set);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this.#handlers.get(event)?.delete(fn);
  }

  once(event, fn) {
    const off = this.on(event, (...args) => { off(); fn(...args); });
    return off;
  }

  emit(event, ...args) {
    this.#handlers.get(event)?.forEach((fn) => {
      try { fn(...args); } catch (err) { console.error(`[bus] "${event}" işleyicisinde hata`, err); }
    });
  }
}
