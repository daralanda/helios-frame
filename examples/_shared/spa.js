/**
 * Demo SPA başlatıcı.
 * Yazılmış sayfalar `routes` ile verilir; menüde olup sayfası yazılmamış her "#/..." bağlantısı için
 * otomatik bir "demo kapsamı dışında" sayfası üretilir. Böylece projenin tüm menüsü eksiksiz gezilebilir.
 * Rol koruması menüdeki `roles` alanından okunur (arayüz koruması; asıl yetki sunucuda).
 */
import { ready } from '../../core/app.js';
import { createRouter } from '../../core/router.js';
import { placeholderPage } from './ui.js';

export async function startSpa({ routes, menu = 'main', source = 'Helios' }) {
  const app = await ready;
  const known = new Set(routes.map((r) => r.path));
  const auto = [];

  // Menüdeki tüm hash bağlantılarını ve rollerini topla (rol filtresi uygulanmadan)
  const walk = (items, inheritedRoles) => {
    for (const it of items) {
      const roles = it.roles ?? inheritedRoles;
      const m = /#(\/[^?]*)/.exec(it.href ?? '');
      if (m) {
        const path = m[1].replace(/\/+$/, '') || '/';
        const r = routes.find((x) => x.path === path);
        if (r && roles && !r.roles) r.roles = roles;
        if (!known.has(path)) {
          known.add(path);
          const label = app.label(it.label);
          auto.push({ path, roles, load: async () => ({ default: placeholderPage(label, source) }) });
        }
      }
      if (it.children) walk(it.children, roles);
    }
  };
  for (const entry of app.config.menu?.menus?.[menu] ?? []) {
    if (entry.items) walk(entry.items, entry.roles); else walk([entry], undefined);
  }

  const router = createRouter({
    routes: [...routes, ...auto],
    outlet: document.getElementById('view'),
    mode: 'hash',
    context: app,
    guard: (route) => (app.can(route.roles) ? true : '/'),
    notFound: () => import('./not-found.js'),
  });
  app.router = router;
  await router.start();
  return app;
}
