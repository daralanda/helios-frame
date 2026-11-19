/** Helios B2B · Bayi portalı demosu (HeliosB2b Dealer alanından uyarlandı). Yatay menü + sepet. */
import { startSpa } from '../../_shared/spa.js';
import { listPage, STATUS } from '../../_shared/ui.js';

const D = 'examples/data/b2b/';
const page = (p) => async () => ({ default: p });

await startSpa({
  menu: 'b2b-dealer',
  source: 'HeliosB2b',
  routes: [
    { path: '/', load: () => import('./pages/home.js') },
    { path: '/katalog', load: () => import('./pages/catalog.js') },
    { path: '/sepet', load: () => import('./pages/cart.js') },
    { path: '/hizli-siparis', load: () => import('./pages/quick-order.js') },
    { path: '/cari', load: () => import('./pages/ledger.js') },
    { path: '/odeme', load: () => import('./pages/payment.js') },
    { path: '/siparislerim', load: page(listPage({
      title: 'Siparişlerim', desc: 'Siparişlerinizin durumu ve kargo bilgisi.', src: `${D}my-orders.json`,
      columns: [
        { key: 'id', label: 'Sipariş' }, { key: 'date', label: 'Tarih', type: 'date' }, { key: 'items', label: 'Kalem', type: 'number' },
        { key: 'cargo', label: 'Kargo' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'total', label: 'Tutar', type: 'money' },
      ],
    })) },
    { path: '/faturalarim', load: page(listPage({
      title: 'Faturalarım', desc: 'e-Fatura ve e-Arşiv belgeleriniz.', src: `${D}invoices.json`,
      transform: (rows) => rows.slice(0, 14),
      columns: [{ key: 'no', label: 'Belge no' }, { key: 'date', label: 'Tarih', type: 'date' }, { key: 'type', label: 'Tür' }, { key: 'total', label: 'Tutar', type: 'money' }],
    })) },
    { path: '/duyurular', load: () => import('./pages/announcements.js') },
  ],
});
