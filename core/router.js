/**
 * Helios Frame · İstemci tarafı yönlendirici (panel/CRM gibi giriş gerektiren SPA alanları için).
 *
 * Vitrin ve ürün sayfaları SEO için gerçek HTML dosyalarıdır; router bunlara karışmaz.
 *
 *   const router = createRouter({
 *     outlet: document.querySelector('#view'),
 *     mode: 'hash',                         // 'hash' (sunucu ayarı gerekmez) | 'history'
 *     routes: [
 *       { path: '/', load: () => import('./pages/dashboard.js') },
 *       { path: '/musteriler/:id', load: () => import('./pages/customer.js'), roles: ['admin'] },
 *     ],
 *     guard: (route) => true | '/giris',     // false/yol döndürürse yönlendirir
 *     context: app,
 *   });
 *
 * Sayfa modülü sözleşmesi:
 *   export default {
 *     title: 'Başlık' | (params) => 'Başlık',
 *     render(ctx, params) { return html`...`; },          // SafeHTML
 *     mount(el, ctx, params) { return () => {/* temizlik *\/}; }  // isteğe bağlı
 *   }
 */
import { render, announce } from './dom.js';

function compile(path) {
  const keys = [];
  const pattern = path
    .replace(/\/+$/, '')
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\/:(\w+)(\\\?)?/g, (_, k, opt) => { keys.push(k); return opt ? '(?:/([^/]+))?' : '/([^/]+)'; })
    .replace(/\*/g, '(.*)');
  return { regex: new RegExp(`^${pattern || ''}/?$`, 'i'), keys };
}

export function createRouter({ routes, outlet, mode = 'hash', base = '/', guard = null, context = {}, notFound = null, onChange = null }) {
  const table = routes.map((r) => ({ ...r, ...compile(r.path) }));
  let cleanup = null;
  let token = 0;
  let currentPath = null;

  const basePath = base.replace(/\/+$/, '');

  function currentLocation() {
    if (mode === 'hash') return (location.hash.slice(1) || '/').split('?')[0];
    let p = location.pathname;
    if (basePath && p.startsWith(basePath)) p = p.slice(basePath.length);
    return p || '/';
  }

  function match(path) {
    for (const route of table) {
      const m = route.regex.exec(path);
      if (m) {
        const params = {};
        route.keys.forEach((k, i) => { if (m[i + 1] !== undefined) params[k] = decodeURIComponent(m[i + 1]); });
        return { route, params };
      }
    }
    return null;
  }

  async function resolve() {
    const path = currentLocation();
    const my = ++token;
    const found = match(path);

    if (found && guard) {
      const verdict = await guard(found.route, found.params);
      if (my !== token) return;
      if (verdict !== true) {
        if (typeof verdict === 'string') navigate(verdict, { replace: true });
        return;
      }
    }

    let page = null;
    try {
      if (found) {
        const mod = await found.route.load();
        page = mod.default ?? mod;
      } else if (notFound) {
        page = (await notFound()).default;
      }
    } catch (err) {
      console.error('[router] sayfa yüklenemedi', err);
      page = { title: 'Hata', render: () => document.createTextNode('Sayfa yüklenemedi. Bağlantınızı kontrol edip yenileyin.') };
    }
    if (my !== token || !page) return; // daha yeni bir gezinme başladı

    const params = found?.params ?? {};
    const swap = () => {
      cleanup?.();
      cleanup = null;
      const out = page.render?.(context, params);
      if (out instanceof Node) outlet.replaceChildren(out);
      else if (out) render(outlet, out);
      else outlet.replaceChildren();
      const result = page.mount?.(outlet, context, params);
      // mount senkron ya da async olabilir; temizlik fonksiyonunu her iki durumda da yakala
      Promise.resolve(result).then((fn) => {
        if (typeof fn !== 'function') return;
        if (my === token) cleanup = fn; else fn(); // bu arada başka sayfaya geçildiyse hemen temizle
      }).catch((err) => console.error('[router] mount hatası', err));
    };
    if (document.startViewTransition && currentPath !== null && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      await document.startViewTransition(swap).updateCallbackDone;
    } else {
      swap();
    }

    const title = typeof page.title === 'function' ? page.title(params) : page.title;
    if (title) document.title = context.config?.seo?.titleTemplate?.replace('%s', title) ?? title;

    // Erişilebilirlik: odağı sayfa başlığına taşı, ekran okuyucuya duyur
    if (currentPath !== null) {
      const h1 = outlet.querySelector('h1');
      if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0 });
      if (title) announce(title);
    }
    currentPath = path;
    onChange?.({ path, params, route: found?.route ?? null });
  }

  function href(path) {
    return mode === 'hash' ? `#${path}` : `${basePath}${path}`;
  }

  function navigate(path, { replace = false } = {}) {
    if (mode === 'hash') {
      const target = `#${path}`;
      if (replace) { history.replaceState(null, '', target); resolve(); }
      else if (location.hash === target) resolve();
      else location.hash = path;
      return;
    }
    history[replace ? 'replaceState' : 'pushState'](null, '', href(path));
    resolve();
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!a || a.target || a.hasAttribute('download') || a.dataset.external !== undefined) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (mode === 'history' && u.pathname.startsWith(basePath)) {
      e.preventDefault();
      navigate(u.pathname.slice(basePath.length) || '/');
    }
    // hash modunda tarayıcı hashchange ile zaten bildirir
  }

  return {
    start() {
      if (mode === 'hash') window.addEventListener('hashchange', resolve);
      else { window.addEventListener('popstate', resolve); document.addEventListener('click', onClick); }
      return resolve();
    },
    stop() {
      window.removeEventListener('hashchange', resolve);
      window.removeEventListener('popstate', resolve);
      document.removeEventListener('click', onClick);
      cleanup?.();
    },
    navigate,
    href,
    get path() { return currentLocation(); },
  };
}
