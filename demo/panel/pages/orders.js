import { html, $ } from '../../../core/dom.js';
import { pageHead, STATUS_BADGES } from './_ui.js';

export default {
  title: 'Siparişler',
  render: () => html`${pageHead('Siparişler', 'Son 30 günün siparişleri.')}
    <hd-table id="orders" page-size="10" searchable caption="Siparişler"></hd-table>`,
  async mount(el, app) {
    const rows = await app.data.get('data/orders.json', { cache: 60000 });
    const t = $('#orders', el);
    if (!t) return;
    t.columns = [
      { key: 'id', label: 'Sipariş' },
      { key: 'customer', label: 'Müşteri' },
      { key: 'date', label: 'Tarih', type: 'date' },
      { key: 'items', label: 'Kalem', type: 'number' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS_BADGES },
      { key: 'total', label: 'Tutar', type: 'money' },
    ];
    t.data = rows;
  },
};
