/**
 * Class tabanlı bileşen tabanı.
 *
 * YAŞAM DÖNGÜSÜ
 *   constructor(props, ctx)
 *     -> [static libs yüklenir]
 *     -> beforeMount()     host element DOM'da, henüz içerik yok. Olay/abonelik kurulumu burada.
 *     -> render()          html`` döndürür (SafeHtml). Düz string HTML olarak yorumlanır!
 *     -> afterRender()     HER render sonrası (ilk dahil). Alt bileşen mount etme / 3. parti widget burada.
 *     -> afterMount()      yalnızca ilk render sonrası. Veri yükleme burada başlar.
 *   setState(patch)
 *     -> shouldUpdate(next, prev) true ise (mikro-görev ile toplu) render() -> afterRender()
 *   destroy()
 *     -> beforeUnmount()   -> iptal sinyali, alt bileşenler, dinleyiciler/abonelikler temizlenir -> DOM'dan çıkar
 *
 * İPUÇLARI
 *  - this.on(...) host üzerinde delege edilir: render'lar arasında yeniden kurmak gerekmez.
 *  - this.signal: bileşen yok edilince iptal olur; fetch'e verin (http.get(url, { signal })).
 *  - Alt bileşenleri afterRender() içinde mountChild() ile bağlayın (her render'da yeniden kurulur).
 *  - Yazılan inputların odağı id / data-key / name ile render sonrası geri yüklenir.
 */
import { SafeHtml, escapeHtml } from './dom.js';

const cssEscape = (s) => (globalThis.CSS?.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, '\\$&'));

export class Component {
  /** İlk mount'tan önce yüklenecek kütüphaneler (src/libs.js anahtarları). */
  static libs = [];
  static tag = 'div';

  state = {};
  el = null;
  mounted = false;

  #destroyed = false;
  #queued = false;
  #cleanups = [];
  #children = new Set();
  #abort = new AbortController();

  constructor(props = {}, ctx = {}) {
    this.props = props;
    this.ctx = ctx;
  }

  get signal() { return this.#abort.signal; }
  get destroyed() { return this.#destroyed; }

  // ---- Geçersiz kılınabilir kancalar -------------------------------------
  beforeMount() {}
  render() { return ''; }
  afterRender() {}
  afterMount() {}
  shouldUpdate(/* next, prev */) { return true; }
  beforeUnmount() {}
  renderError(err) {
    return `<div class="alert alert-danger" role="alert">${escapeHtml(err?.message ?? err)}</div>`;
  }

  // ---- Yaşam döngüsü ------------------------------------------------------
  async mount(target) {
    if (typeof target === 'string') target = document.querySelector(target);
    await this.ctx.loader?.load(this.constructor.libs);
    if (this.#destroyed) return this;

    this.el = document.createElement(this.constructor.tag);
    this.el.className = 'hf-host';
    this.el.dataset.hf = this.constructor.name;
    target.append(this.el);

    this.beforeMount();
    this.#paint();
    this.mounted = true;
    this.afterMount();
    return this;
  }

  setState(patch) {
    const prev = this.state;
    const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
    const update = this.shouldUpdate(next, prev);
    this.state = next;
    if (!update || !this.mounted || this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      this.update();
    });
  }

  /** Durum değişmeden zorla yeniden çiz (örn. store aboneliğinden). */
  update() {
    if (this.mounted && !this.#destroyed) this.#paint();
  }

  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;
    if (this.mounted) {
      try { this.beforeUnmount(); } catch (err) { console.error(err); }
    }
    this.#abort.abort();
    this.#destroyChildren();
    for (const fn of this.#cleanups.splice(0)) {
      try { fn(); } catch (err) { console.error(err); }
    }
    this.el?.remove();
    this.mounted = false;
  }

  // ---- Yardımcılar --------------------------------------------------------
  addCleanup(fn) { this.#cleanups.push(fn); return fn; }

  listen(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    return this.addCleanup(() => target.removeEventListener(type, handler, opts));
  }

  /** Host üzerinde delege olay: this.on('click', '[data-add]', (e, el) => ...) */
  on(type, selector, handler) {
    return this.listen(this.el, type, (e) => {
      const hit = e.target?.closest?.(selector);
      if (hit && this.el.contains(hit)) handler.call(this, e, hit);
    });
  }

  /** Store aboneliği (bileşen yok edilince otomatik iptal). */
  watch(store, selector, handler) {
    return this.addCleanup(store.subscribe(handler, selector));
  }

  onBus(event, handler) {
    return this.addCleanup(this.ctx.bus.on(event, handler));
  }

  $(selector) { return this.el.querySelector(selector); }
  $$(selector) { return Array.from(this.el.querySelectorAll(selector)); }
  href(path) { return this.ctx.router.href(path); }

  /** Alt bileşen bağla. target: element ya da bu bileşen içindeki seçici. */
  async mountChild(ChildClass, target, props = {}) {
    if (typeof target === 'string') target = this.$(target);
    if (!target || this.#destroyed) return null;

    const child = new ChildClass(props, this.ctx);
    this.#children.add(child);
    try {
      await child.mount(target);
    } catch (err) {
      console.error(`[${ChildClass.name}] yüklenemedi`, err);
      target.innerHTML = this.renderError(err);
      return null;
    }
    if (child.destroyed) return null; // ebeveyn bu arada yeniden çizildi / yok edildi
    return child;
  }

  // ---- İç işleyiş ---------------------------------------------------------
  #paint() {
    this.#destroyChildren();
    const focus = this.#captureFocus();

    let out;
    try {
      out = this.render();
    } catch (err) {
      console.error(`[${this.constructor.name}] render hatası`, err);
      out = this.renderError(err);
    }
    this.el.innerHTML = out instanceof SafeHtml ? out.value : String(out ?? '');

    this.#restoreFocus(focus);
    try { this.afterRender(); } catch (err) { console.error(`[${this.constructor.name}] afterRender`, err); }
  }

  #destroyChildren() {
    for (const child of this.#children) child.destroy();
    this.#children.clear();
  }

  #captureFocus() {
    const a = document.activeElement;
    if (!a || a === this.el || !this.el.contains(a)) return null;
    const key = a.id ? `#${cssEscape(a.id)}`
      : a.dataset?.key ? `[data-key="${cssEscape(a.dataset.key)}"]`
      : a.name ? `[name="${cssEscape(a.name)}"]` : null;
    if (!key) return null;
    let start = null; let end = null;
    try { start = a.selectionStart; end = a.selectionEnd; } catch { /* bazı input tipleri desteklemez */ }
    return { key, start, end };
  }

  #restoreFocus(saved) {
    if (!saved) return;
    const el = this.el.querySelector(saved.key);
    if (!el) return;
    el.focus({ preventScroll: true });
    if (saved.start != null) {
      try { el.setSelectionRange(saved.start, saved.end); } catch { /* yok say */ }
    }
  }
}
