import { html, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, STATUS_BADGES } from './_ui.js';

export default {
  title: 'Teklifler',
  render: () => html`${pageHead('Teklifler', 'Hazırlanan ve gönderilen teklifler.',
    html`<a class="hf-btn hf-btn--primary" href="#/teklifler/yeni">${icon('plus')}Yeni teklif</a>`)}
    <hd-table id="quotes" page-size="10" searchable caption="Teklifler"></hd-table>`,

  async mount(el, app) {
    const customers = await app.data.get('examples/data/customers.json', { cache: 60000 });
    const t = $('#quotes', el);
    if (!t) return;
    const states = ['Taslak', 'Gönderildi', 'Onaylandı', 'Reddedildi'];
    // Demo verisi: müşterilerden deterministik teklif listesi
    t.columns = [
      { key: 'no', label: 'Teklif no' },
      { key: 'customer', label: 'Müşteri' },
      { key: 'date', label: 'Tarih', type: 'date' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS_BADGES },
      { key: 'total', label: 'Tutar', type: 'money' },
    ];
    t.data = customers.slice(0, 24).map((c, i) => ({
      no: `TK-2026-${String(100 + i).padStart(3, '0')}`,
      customer: c.name,
      date: c.lastActivity,
      status: states[i % states.length],
      total: Math.round(Math.abs(c.balance) / 3 + 5000),
    }));
  },
};
