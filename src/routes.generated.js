/**
 * OTOMATİK ÜRETİLDİ: elle düzenlemeyin.
 * Kaynak: src/pages/ altındaki tüm *.page.js dosyaları   ·   Üretici: node tools/generate-routes.mjs
 * Layout ve meta bilgisi sayfa sınıflarındaki `static layout` / `static meta` alanlarından okunur.
 */
export const generatedRoutes = [
  { path: '/', component: () => import('./pages/index.page.js') },
  { path: '/b2b/customers', component: () => import('./pages/b2b/customers.page.js') },
  { path: '/b2b/dashboard', component: () => import('./pages/b2b/dashboard.page.js') },
  { path: '/b2b/quotes', component: () => import('./pages/b2b/quotes/index.page.js') },
  { path: '/b2b/quotes/new', component: () => import('./pages/b2b/quotes/new.page.js') },
  { path: '/login', component: () => import('./pages/login.page.js') },
  { path: '/shop', component: () => import('./pages/shop/index.page.js') },
  { path: '/shop/cart', component: () => import('./pages/shop/cart.page.js') },
  { path: '/shop/checkout', component: () => import('./pages/shop/checkout.page.js') },
  { path: '/shop/order/:id', component: () => import('./pages/shop/order/%5Bid%5D.page.js') },
  { path: '/shop/:slug', component: () => import('./pages/shop/%5Bslug%5D.page.js') },
  { path: '*', component: () => import('./pages/404.page.js') },
];
