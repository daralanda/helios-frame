/** Helios HR demosu (HeliosHr'den uyarlandı): PDKS, personel, izin, puantaj, vardiya, bordro ve çalışan self-servis. */
import { html } from '../../core/dom.js';
import { startSpa } from '../_shared/spa.js';
import { listPage, STATUS } from '../_shared/ui.js';

const D = 'examples/data/hr/';
const page = (p) => async () => ({ default: p });

await startSpa({
  menu: 'hr',
  source: 'HeliosHr',
  routes: [
    { path: '/', load: () => import('./pages/pdks.js') },
    { path: '/pdks', load: () => import('./pages/pdks.js') },
    { path: '/puantaj', load: () => import('./pages/timesheet.js') },
    { path: '/vardiya', load: () => import('./pages/shifts.js') },
    { path: '/izinler', load: () => import('./pages/leaves.js') },
    { path: '/onaylar', load: () => import('./pages/leaves.js') },
    { path: '/organizasyon', load: () => import('./pages/org.js') },
    { path: '/benim', load: () => import('./pages/me.js') },
    { path: '/benim/izinler', load: () => import('./pages/my-leaves.js') },
    { path: '/benim/puantaj', load: () => import('./pages/timesheet.js') },
    { path: '/benim/pusulalar', load: () => import('./pages/payslips.js') },
    { path: '/kim-iceride', load: page(listPage({
      title: 'Kim içeride', desc: 'Turnike ve kart okuyuculardan gelen son geçişlere göre anlık durum.', src: `${D}presence.json`,
      columns: [
        { key: 'sicil', label: 'Sicil' }, { key: 'name', label: 'Personel' }, { key: 'dept', label: 'Departman' },
        { key: 'state', label: 'Durum', type: 'badge', badges: STATUS },
        { key: 'inTime', label: 'Giriş', render: (r, a) => (r.inTime ? new Intl.DateTimeFormat(a.config.locale, { timeStyle: 'short' }).format(new Date(r.inTime)) : '—') },
        { key: 'door', label: 'Kapı', render: (r) => r.door ?? '—' },
      ],
      filter: { key: 'state', label: 'Durum', options: ['İçeride', 'Geç kaldı', 'İzinli', 'Raporlu', 'Gelmedi'] },
    })) },
    { path: '/personel', load: page(listPage({
      title: 'Personel', desc: 'Özlük kartları, departman, vardiya ve izin bakiyeleri.', src: `${D}employees.json`,
      columns: [
        { key: 'sicil', label: 'Sicil' }, { key: 'name', label: 'Ad soyad' }, { key: 'dept', label: 'Departman' }, { key: 'title', label: 'Pozisyon' },
        { key: 'start', label: 'Giriş tarihi', type: 'date' }, { key: 'shift', label: 'Vardiya' },
        { key: 'leaveBalance', label: 'İzin bakiyesi', type: 'number' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS },
      ],
      filter: { key: 'dept', label: 'Departman', options: ['Üretim', 'Depo ve lojistik', 'Satış', 'Finans', 'İnsan kaynakları', 'Bilgi teknolojileri', 'Kalite', 'Bakım'] },
    })) },
    { path: '/bordro', load: page(listPage({
      title: 'Bordro dönemleri', desc: 'Hesaplama, kapanış ve banka listesi durumları.', src: `${D}payroll.json`,
      actions: html`<a class="hf-btn hf-btn--primary" href="#/simulasyon">Maliyet simülasyonu</a>`,
      columns: [
        { key: 'period', label: 'Dönem' }, { key: 'employees', label: 'Personel', type: 'number' },
        { key: 'gross', label: 'Brüt toplam', type: 'money' }, { key: 'net', label: 'Net toplam', type: 'money' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS },
      ],
      transform: (rows) => [...rows].reverse(),
    })) },
    { path: '/cihazlar', load: page(listPage({
      title: 'Cihazlar', desc: 'Turnike, yüz tanıma terminali, kiosk ve UHF okuyucular.', src: `${D}devices.json`,
      columns: [
        { key: 'name', label: 'Cihaz' }, { key: 'type', label: 'Model' }, { key: 'location', label: 'Konum' }, { key: 'ip', label: 'IP' },
        { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'last', label: 'Son iletişim', type: 'relative' }, { key: 'events', label: 'Bugünkü olay', type: 'number' },
      ],
    })) },
  ],
});
