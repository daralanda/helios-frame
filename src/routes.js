/**
 * Rota ve layout tanımları. Sayfalar tembel yüklenir (yalnızca ziyaret edilince indirilir).
 * Sıra önemlidir: özel yollar (/shop/cart) parametreli yollardan (/shop/:slug) ÖNCE gelmelidir.
 */
export const layouts = {
  default: () => import('./layouts/default.layout.js'),
  shop: () => import('./layouts/shop.layout.js'),
  b2b: () => import('./layouts/b2b.layout.js'),
  blank: () => import('./layouts/blank.layout.js'),
};

export const routes = [
  { path: '/', component: () => import('./pages/home.page.js'), layout: 'default', meta: { title: 'Ana Sayfa' } },

  // ---- E-ticaret ----
  { path: '/shop', component: () => import('./pages/shop/list.page.js'), layout: 'shop', meta: { title: 'Ürünler' } },
  { path: '/shop/cart', component: () => import('./pages/shop/cart.page.js'), layout: 'shop', meta: { title: 'Sepet' } },
  { path: '/shop/checkout', component: () => import('./pages/shop/checkout.page.js'), layout: 'shop', meta: { title: 'Ödeme' } },
  { path: '/shop/order/:id', component: () => import('./pages/shop/order.page.js'), layout: 'shop', meta: { title: 'Sipariş' } },
  { path: '/shop/:slug', component: () => import('./pages/shop/detail.page.js'), layout: 'shop', meta: { title: 'Ürün Detayı' } },

  // ---- B2B ----
  { path: '/login', component: () => import('./pages/b2b/login.page.js'), layout: 'blank', meta: { title: 'Giriş' } },
  { path: '/b2b', redirect: '/b2b/dashboard' },
  { path: '/b2b/dashboard', component: () => import('./pages/b2b/dashboard.page.js'), layout: 'b2b', meta: { title: 'Panel', auth: true } },
  { path: '/b2b/customers', component: () => import('./pages/b2b/customers.page.js'), layout: 'b2b', meta: { title: 'Müşteriler', auth: true } },
  { path: '/b2b/quotes', component: () => import('./pages/b2b/quotes.page.js'), layout: 'b2b', meta: { title: 'Teklifler', auth: true } },
  { path: '/b2b/quotes/new', component: () => import('./pages/b2b/quote-form.page.js'), layout: 'b2b', meta: { title: 'Yeni Teklif', auth: true } },

  { path: '*', component: () => import('./pages/not-found.page.js'), layout: 'default', meta: { title: 'Sayfa Bulunamadı' } },
];
