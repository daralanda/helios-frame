/**
 * Rota ve layout tanımları.
 *
 * Sayfa rotaları dosya sistemine göre OTOMATİK üretilir (Next.js `pages/` mantığı):
 *   src/pages/**\/*.page.js  ->  src/routes.generated.js     (node tools/generate-routes.mjs)
 * Yeni sayfa eklemek için yalnızca src/pages/ altına dosya oluşturmanız yeterlidir (bkz. docs/index.html).
 *
 * Aşağıdaki `manualRoutes` yalnızca dosyadan türetilemeyenler içindir: yönlendirmeler, özel yollar,
 * ya da Node.js çalıştıramıyorsanız elle eklediğiniz sayfalar. Elle yazılanlar önceliklidir.
 */
import { generatedRoutes } from './routes.generated.js';

export const layouts = {
  default: () => import('./layouts/default.layout.js'),
  shop: () => import('./layouts/shop.layout.js'),
  b2b: () => import('./layouts/b2b.layout.js'),
  blank: () => import('./layouts/blank.layout.js'),
};

export const manualRoutes = [
  { path: '/b2b', redirect: '/b2b/dashboard' },
  // Örnek (Node'suz elle ekleme):
  // { path: '/hakkimizda', component: () => import('./pages/hakkimizda.page.js') },
];

export const routes = [...manualRoutes, ...generatedRoutes];
