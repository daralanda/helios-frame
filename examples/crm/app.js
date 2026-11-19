/** Helios CRM demosu (HeliosCrm'den uyarlandı): firmalar, kişiler, lead'ler, satış hunisi, aktiviteler, teklifler. */
import { html } from '../../core/dom.js';
import { startSpa } from '../_shared/spa.js';
import { listPage, STATUS } from '../_shared/ui.js';

const D = 'examples/data/crm/';
const page = (p) => async () => ({ default: p });
const tags = (r) => html`<span class="hf-cluster hf-gap-2">${(r.tags ?? []).map((t) => html`<span class="hf-badge hf-badge--primary">${t}</span>`)}</span>`;

await startSpa({
  menu: 'crm',
  source: 'HeliosCrm',
  routes: [
    { path: '/', load: () => import('./pages/dashboard.js') },
    { path: '/huni', load: () => import('./pages/pipeline.js') },
    { path: '/aktiviteler', load: () => import('./pages/activities.js') },
    { path: '/leadler', load: () => import('./pages/leads.js') },
    { path: '/raporlar', load: () => import('./pages/reports.js') },
    { path: '/firmalar', load: page(listPage({
      title: 'Firmalar', desc: 'Müşteri ve aday firmalar; VKN/TCKN denetimli kayıt.', src: `${D}companies.json`,
      columns: [
        { key: 'name', label: 'Firma' }, { key: 'city', label: 'Şehir' }, { key: 'sector', label: 'Sektör' }, { key: 'phone', label: 'Telefon' },
        { key: 'owner', label: 'Sorumlu' }, { key: 'openDeals', label: 'Açık fırsat', type: 'number' }, { key: 'tags', label: 'Etiketler', sortable: false, render: tags },
      ],
      filter: { key: 'sector', label: 'Sektör', options: ['Üretim', 'Enerji', 'Lojistik', 'Perakende', 'Tarım', 'İnşaat', 'Sağlık'] },
    })) },
    { path: '/kisiler', load: page(listPage({
      title: 'Kişiler', desc: 'Firma yetkilileri. KVKK açık rızası olmayan kişilere toplu e-posta gönderilmez.', src: `${D}contacts.json`,
      columns: [
        { key: 'name', label: 'Ad soyad' }, { key: 'company', label: 'Firma' }, { key: 'title', label: 'Unvan' },
        { key: 'email', label: 'E-posta', render: (r) => html`<a href="${`mailto:${r.email}`}">${r.email}</a>` }, { key: 'phone', label: 'Telefon' },
        { key: 'consent', label: 'KVKK rızası', render: (r) => html`<span class="hf-badge hf-badge--${r.consent ? 'success' : 'warning'}">${r.consent ? 'Var' : 'Yok'}</span>` },
      ],
    })) },
    { path: '/teklifler', load: page(listPage({
      title: 'Teklifler', desc: 'PDF olarak gönderilen teklifler ve geçerlilik tarihleri.', src: `${D}quotes.json`,
      columns: [
        { key: 'no', label: 'Teklif no' }, { key: 'title', label: 'Konu' }, { key: 'company', label: 'Firma' }, { key: 'date', label: 'Tarih', type: 'date' },
        { key: 'validUntil', label: 'Geçerlilik', type: 'date' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'total', label: 'Tutar', type: 'money' },
      ],
      filter: { key: 'status', label: 'Durum', options: ['Taslak', 'Gönderildi', 'Kabul edildi', 'Reddedildi'] },
    })) },
    { path: '/urunler', load: page(listPage({
      title: 'Ürün ve hizmetler', desc: 'Tekliflerde kullanılan ürün kataloğu.', src: `${D}products.json`,
      columns: [{ key: 'code', label: 'Kod' }, { key: 'name', label: 'Ad' }, { key: 'unit', label: 'Birim' }, { key: 'vat', label: 'KDV %', type: 'number' }, { key: 'price', label: 'Birim fiyat', type: 'money' }],
    })) },
    { path: '/asamalar', load: page(listPage({
      title: 'Satış aşamaları', desc: 'Huni aşamaları, kazanma olasılıkları ve renkleri.', src: `${D}stages.json`,
      columns: [
        { key: 'name', label: 'Aşama', render: (r) => html`<span class="hf-cluster hf-gap-2"><span class="hf-swatch" data-hf-color="${r.color}"></span>${r.name}</span>` },
        { key: 'prob', label: 'Olasılık %', type: 'number' },
      ],
    })) },
  ],
});
