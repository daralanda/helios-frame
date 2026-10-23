/**
 * Uygulama başlatıcı: bağlam (ctx) oluşturur, router'ı kurar.
 *
 * ctx (her bileşende this.ctx):
 *   config, store, bus, loader, toast, services, router
 */
import { config } from './config.js';
import { loader } from './libs.js';
import { routes, layouts } from './routes.js';
import { Store } from './core/store.js';
import { Emitter } from './core/events.js';
import { Router } from './core/router.js';
import { createServices } from './services/index.js';
import { createToaster } from './ui/toast.js';
import { initialState } from './store/state.js';

export async function boot(root) {
  const store = new Store(initialState, {
    persistKey: `${config.storage.prefix}app`,
    persistKeys: ['cart', 'user', 'prefs'],
    version: 1,
  });

  const ctx = { config, store, bus: new Emitter(), loader, toast: createToaster() };
  ctx.services = createServices(ctx);

  const router = new Router({ routes, layouts, mode: config.router.mode, outlet: root, ctx });

  // Yetki kontrolü: meta.auth olan rotalar giriş ister.
  router.beforeEach((to) => {
    const user = store.state.user;
    if (to.meta.auth && !user) return `/login?next=${encodeURIComponent(to.path)}`;
    if (to.path === '/login' && user) return '/b2b/dashboard';
    return true;
  });

  await router.start();
  if (config.debug) window.__helios = ctx; // konsoldan inceleme: __helios.store.state
  return ctx;
}
