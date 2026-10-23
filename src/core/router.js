/**
 * İstemci tarafı yönlendirici (hash veya History API).
 *
 * Rota tanımı (çoğunlukla src/pages/ dosyalarından tools/generate-routes.mjs ile üretilir):
 *   { path: '/shop/:slug', component: () => import('./pages/shop/%5Bslug%5D.page.js') }   // tembel yükleme
 *   - path:  ':param' ve sondaki '*' (joker) desteklenir. Sıra önemlidir: ilk eşleşen kazanır.
 *   - component: Component alt sınıfı YA DA `() => import(...)` (modülün default export'u kullanılır).
 *   - redirect: '/baska/yol'
 *   - layout / meta: rota üzerinde verilebilir; ancak sayfa sınıfındaki `static layout` ve
 *     `static meta` DAHA ÖNCELİKLİDİR (Next.js'te sayfa dosyasının kendi ayarını taşıması gibi).
 *
 * Guard:
 *   router.beforeEach((to, from) => true | false | '/yonlendirilecek/yol')
 *   (guard çalışırken sayfa sınıfı yüklenmiştir, böylece `to.meta` sayfanın static meta'sını içerir)
 *
 * Sayfa yaşam döngüsü: yeni rota -> sayfa sınıfı yüklenir -> guard'lar -> layout yüklenir ->
 * eski sayfa destroy() -> (layout değiştiyse eski layout destroy()) -> yeni sayfa mount().
 * Yarış durumları nav-id ile elenir.
 */
import { Component } from './component.js';
import { escapeHtml } from './dom.js';

const isComponentClass = (c) => typeof c === 'function' && c.prototype instanceof Component;

function compile(path) {
  const keys = [];
  const pattern = path
    .replace(/\/+$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/:([A-Za-z_]\w*)/g, (_, key) => { keys.push(key); return '([^/]+)'; })
    .replace(/\*/g, () => { keys.push('wildcard'); return '(.*)'; });
  return { regex: new RegExp(`^${pattern}/?$`), keys };
}

export class Router {
  #routes;
  #layouts;
  #mode;
  #base;
  #root;
  #ctx;
  #guards = [];
  #cache = new Map();
  #nav = 0;
  #layout = null;
  #layoutKey = null;
  #page = null;

  /** Şu anki rota: { path, params, query, route, meta } */
  current = null;

  constructor({ routes, layouts = {}, mode = 'hash', base, outlet, ctx }) {
    this.#routes = routes.map((route) => ({ ...route, ...compile(route.path) }));
    this.#layouts = layouts;
    this.#mode = mode;
    this.#base = base ?? new URL('.', document.baseURI).pathname; // örn. "/" veya "/proje/"
    this.#root = outlet;
    this.#ctx = ctx;
    ctx.router = this;
  }

  beforeEach(fn) {
    this.#guards.push(fn);
    return this;
  }

  /** Bağlantılarda kullanılacak href üretir: href('/shop') -> "#/shop" veya "/shop". */
  href(path) {
    return this.#mode === 'hash' ? `#${path}` : this.#base.replace(/\/$/, '') + path;
  }

  navigate(path, { replace = false } = {}) {
    if (this.#mode === 'hash') {
      if (replace) location.replace(this.href(path));
      else location.hash = path;
      return Promise.resolve();
    }
    history[replace ? 'replaceState' : 'pushState']({}, '', this.href(path));
    return this.#resolve();
  }

  /** Sayfayı yeniden yüklemeden sorgu parametrelerini günceller (filtre/sayfalama için). */
  setQuery(params = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== '' && v != null) qs.set(k, v);
    const search = qs.toString() ? `?${qs}` : '';
    const path = this.current?.path ?? '/';
    history.replaceState(history.state, '', this.href(path) + search);
    if (this.current) this.current = { ...this.current, query: Object.fromEntries(qs) };
  }

  start() {
    window.addEventListener(this.#mode === 'hash' ? 'hashchange' : 'popstate', this.#onChange);
    if (this.#mode === 'history') document.addEventListener('click', this.#onClick);
    return this.#resolve();
  }

  stop() {
    window.removeEventListener('hashchange', this.#onChange);
    window.removeEventListener('popstate', this.#onChange);
    document.removeEventListener('click', this.#onClick);
    this.#page?.destroy();
    this.#layout?.destroy();
    this.#page = this.#layout = this.#layoutKey = null;
  }

  // ---- İç işleyiş ---------------------------------------------------------
  #onChange = () => { this.#resolve(); };

  #onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target?.closest?.('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-external')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith(this.#base)) return;
    e.preventDefault();
    this.navigate(`/${url.pathname.slice(this.#base.length)}${url.search}`);
  };

  #location() {
    if (this.#mode === 'hash') {
      const raw = location.hash.slice(1) || '/';
      const i = raw.indexOf('?');
      const path = i < 0 ? raw : raw.slice(0, i);
      return { path: path.startsWith('/') ? path : `/${path}`, query: i < 0 ? '' : raw.slice(i + 1) };
    }
    const path = `/${location.pathname.startsWith(this.#base) ? location.pathname.slice(this.#base.length) : location.pathname.slice(1)}`;
    return { path, query: location.search.slice(1) };
  }

  #match(path) {
    for (const route of this.#routes) {
      const m = route.regex.exec(path);
      if (!m) continue;
      const params = {};
      route.keys.forEach((key, i) => { params[key] = decodeURIComponent(m[i + 1]); });
      return { route, params };
    }
    return null;
  }

  async #classOf(source) {
    if (isComponentClass(source)) return source;
    if (!this.#cache.has(source)) {
      this.#cache.set(source, Promise.resolve(source()).then((mod) => mod.default ?? mod).catch((err) => {
        this.#cache.delete(source);
        throw err;
      }));
    }
    return this.#cache.get(source);
  }

  async #resolve() {
    const id = ++this.#nav;
    const { path, query } = this.#location();
    const found = this.#match(path);
    if (!found) return this.#showError(new Error(`Sayfa bulunamadı: ${path}`));

    const { route, params } = found;
    const from = this.current;

    if (route.redirect) return this.navigate(route.redirect, { replace: true });

    try {
      const PageClass = await this.#classOf(route.component);
      if (id !== this.#nav) return;

      // Sayfa sınıfındaki static meta/layout, rota tanımındakilerin önüne geçer.
      const meta = { ...route.meta, ...PageClass.meta };
      const layoutKey = PageClass.layout ?? route.layout ?? 'default';
      const to = { path, params, query: Object.fromEntries(new URLSearchParams(query)), route, meta, layout: layoutKey };

      for (const guard of this.#guards) {
        let result;
        try { result = await guard(to, from); } catch (err) { console.error('[router] guard hatası', err); result = false; }
        if (id !== this.#nav) return;
        if (typeof result === 'string') return this.navigate(result, { replace: true });
        if (result === false) {
          if (from) this.navigate(from.path, { replace: true });
          return;
        }
      }

      if (!this.#layouts[layoutKey]) throw new Error(`Layout bulunamadı: "${layoutKey}" (src/routes.js -> layouts)`);
      const LayoutClass = layoutKey !== this.#layoutKey ? await this.#classOf(this.#layouts[layoutKey]) : null;
      if (id !== this.#nav) return;

      this.current = to; // layout/sayfa mount sırasında okuyabilsin
      this.#page?.destroy();
      this.#page = null;

      if (LayoutClass) {
        this.#layout?.destroy();
        this.#layout = new LayoutClass({}, this.#ctx);
        this.#layoutKey = layoutKey;
        await this.#layout.mount(this.#root);
        if (id !== this.#nav) return;
      }

      const outlet = this.#layout.outlet;
      const page = new PageClass({ params: to.params, query: to.query, route: to }, this.#ctx);
      outlet.classList.add('hf-loading');
      await page.mount(outlet);
      outlet.classList.remove('hf-loading');
      if (id !== this.#nav) { page.destroy(); return; }
      this.#page = page;

      const title = typeof to.meta.title === 'function' ? to.meta.title(to) : to.meta.title;
      document.title = title ? `${title} · ${this.#ctx.config.appName}` : this.#ctx.config.appName;
      window.scrollTo(0, 0);
      this.#ctx.bus.emit('route:change', to, from);
    } catch (err) {
      console.error('[router]', err);
      if (id === this.#nav) this.#showError(err);
    }
  }

  #showError(err) {
    this.#page?.destroy();
    this.#layout?.destroy();
    this.#page = this.#layout = this.#layoutKey = null;
    this.#root.innerHTML =
      `<div class="container py-5"><div class="alert alert-danger" role="alert">${escapeHtml(err.message)}</div></div>`;
  }
}
