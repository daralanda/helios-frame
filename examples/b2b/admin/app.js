/** Helios B2B · Yönetim paneli demosu (HeliosB2b Admin alanından uyarlandı). */
import { html } from '../../../core/dom.js';
import { startSpa } from '../../_shared/spa.js';
import { listPage, STATUS } from '../../_shared/ui.js';

const D = 'examples/data/b2b/';
const riskBadge = (r) => html`<span class="hf-badge hf-badge--${r.risk >= 90 ? 'danger' : r.risk >= 70 ? 'warning' : 'success'}">%${r.risk}</span>`;
const orderCols = [
  { key: 'id', label: 'Sipariş' },
  { key: 'dealer', label: 'Bayi' },
  { key: 'date', label: 'Tarih', type: 'relative' },
  { key: 'channel', label: 'Kanal' },
  { key: 'items', label: 'Kalem', type: 'number' },
  { key: 'status', label: 'Durum', type: 'badge', badges: STATUS },
  { key: 'total', label: 'Tutar', type: 'money' },
];
const page = (p) => async () => ({ default: p });

await startSpa({
  menu: 'b2b-admin',
  source: 'HeliosB2b',
  routes: [
    { path: '/', load: () => import('./pages/dashboard.js') },
    { path: '/onaylar', load: () => import('./pages/approvals.js') },
    { path: '/siparisler', load: page(listPage({
      title: 'Siparişler', desc: 'Tüm kanallardan gelen bayi siparişleri.', src: `${D}orders.json`, columns: orderCols,
      filter: { key: 'status', label: 'Durum filtresi', options: ['Onay bekliyor', 'Hazırlanıyor', 'Sevk bekliyor', 'Kargoda', 'Teslim edildi', 'İptal'] },
    })) },
    { path: '/sevk-bekleyenler', load: page(listPage({
      title: 'Sevk bekleyenler', desc: 'Depoda toplanıp kargoya verilmeyi bekleyen siparişler.', src: `${D}orders.json`,
      columns: [...orderCols.slice(0, 3), { key: 'cargo', label: 'Kargo' }, ...orderCols.slice(4)],
      transform: (rows) => rows.filter((r) => r.status === 'Sevk bekliyor' || r.status === 'Hazırlanıyor'),
    })) },
    { path: '/bayiler', load: () => import('./pages/dealers.js') },
    { path: '/cari', load: page(listPage({
      title: 'Cari hesaplar', desc: 'Bayi bakiyeleri, risk limitleri ve limit kullanım oranı.', src: `${D}dealers.json`,
      columns: [
        { key: 'id', label: 'Cari kod' }, { key: 'name', label: 'Bayi' }, { key: 'group', label: 'Grup' },
        { key: 'limit', label: 'Risk limiti', type: 'money' }, { key: 'balance', label: 'Bakiye', type: 'money' },
        { key: 'risk', label: 'Kullanım', type: 'number', render: riskBadge },
      ],
      filter: { key: 'group', label: 'Grup filtresi', options: ['Altın bayi', 'Gümüş bayi', 'Bronz bayi', 'Distribütör', 'Proje müşterisi'] },
    })) },
    { path: '/faturalar', load: page(listPage({
      title: 'Faturalar', desc: 'e-Fatura ve e-Arşiv belgeleri ile GİB gönderim durumu.', src: `${D}invoices.json`,
      columns: [
        { key: 'no', label: 'Belge no' }, { key: 'dealer', label: 'Bayi' }, { key: 'date', label: 'Tarih', type: 'date' },
        { key: 'type', label: 'Tür' }, { key: 'gib', label: 'GİB durumu', type: 'badge', badges: STATUS }, { key: 'total', label: 'Tutar', type: 'money' },
      ],
      filter: { key: 'type', label: 'Belge türü', options: ['e-Fatura', 'e-Arşiv'] },
    })) },
    { path: '/odemeler', load: page(listPage({
      title: 'Kartlı ödemeler', desc: 'Sanal POS üzerinden 3D Secure ile alınan tahsilatlar.', src: `${D}payments.json`,
      columns: [
        { key: 'id', label: 'İşlem' }, { key: 'dealer', label: 'Bayi' }, { key: 'date', label: 'Tarih', type: 'relative' },
        { key: 'bank', label: 'Banka' }, { key: 'installments', label: 'Taksit', type: 'number' },
        { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'amount', label: 'Tutar', type: 'money' },
      ],
      filter: { key: 'status', label: 'Durum', options: ['Başarılı', '3D doğrulanamadı', 'İade edildi'] },
    })) },
    { path: '/urunler', load: page(listPage({
      title: 'Ürünler', desc: 'Katalog, liste ve bayi fiyatları.', src: `${D}products.json`,
      columns: [
        { key: 'sku', label: 'Kod' }, { key: 'name', label: 'Ürün' }, { key: 'cat', label: 'Kategori' }, { key: 'brand', label: 'Marka' },
        { key: 'listPrice', label: 'Liste fiyatı', type: 'money' }, { key: 'dealerPrice', label: 'Bayi fiyatı', type: 'money' }, { key: 'stock', label: 'Stok', type: 'number' },
      ],
      filter: { key: 'cat', label: 'Kategori', options: ['Sensör', 'Ağ geçidi', 'Röle & kontrol', 'Enerji', 'Aksesuar', 'Kablo', 'Pano', 'Yazılım'] },
    })) },
    { path: '/stok', load: page(listPage({
      title: 'Stok', desc: 'Depo bazlı stok durumu; 10 adedin altı kritik sayılır.', src: `${D}products.json`,
      columns: [
        { key: 'sku', label: 'Kod' }, { key: 'name', label: 'Ürün' }, { key: 'unit', label: 'Birim' },
        { key: 'stock', label: 'Miktar', type: 'number' },
        { key: 'critical', label: 'Durum', render: (r) => html`<span class="hf-badge hf-badge--dot hf-badge--${r.stock === 0 ? 'danger' : r.critical ? 'warning' : 'success'}">${r.stock === 0 ? 'Tükendi' : r.critical ? 'Kritik' : 'Yeterli'}</span>` },
      ],
    })) },
    { path: '/raporlar/kritik-stok', load: page(listPage({
      title: 'Kritik stok', desc: 'Sipariş verilmesi gereken ürünler.', src: `${D}products.json`,
      columns: [{ key: 'sku', label: 'Kod' }, { key: 'name', label: 'Ürün' }, { key: 'cat', label: 'Kategori' }, { key: 'stock', label: 'Stok', type: 'number' }],
      transform: (rows) => rows.filter((r) => r.critical),
    })) },
    { path: '/raporlar', load: () => import('./pages/reports.js') },
  ],
});
