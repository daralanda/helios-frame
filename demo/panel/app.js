/** B2B / CRM panel demosu · SPA (hash router). Her sayfa ayrı modül; ihtiyaç anında yüklenir. */
import { ready } from '../../core/app.js';
import { createRouter } from '../../core/router.js';

const app = await ready;

const routes = [
  { path: '/', load: () => import('./pages/dashboard.js') },
  { path: '/musteriler', load: () => import('./pages/customers.js') },
  { path: '/firsatlar', load: () => import('./pages/deals.js') },
  { path: '/teklifler', load: () => import('./pages/quotes.js') },
  { path: '/teklifler/yeni', load: () => import('./pages/quote-new.js') },
  { path: '/siparisler', load: () => import('./pages/orders.js') },
  { path: '/raporlar', load: () => import('./pages/reports.js'), roles: ['admin'] },
  { path: '/ayarlar', load: () => import('./pages/settings.js') },
];

const router = createRouter({
  routes,
  outlet: document.getElementById('view'),
  mode: 'hash',
  context: app,
  // Arayüz koruması: yetkisiz rota ana sayfaya döner. Asıl yetki kontrolü API'de yapılır.
  guard: (route) => (app.can(route.roles) ? true : '/'),
  notFound: () => import('./pages/not-found.js'),
});

app.router = router;
router.start();
