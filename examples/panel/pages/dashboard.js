import { html, render, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { kpiCard } from '../../kpi.js';
import { pageHead, STATUS_BADGES } from './_ui.js';

export default {
  title: 'Gösterge paneli',
  render(app) {
    const first = String(app.user?.name ?? '').split(' ')[0];
    return html`
      ${pageHead(`Hoş geldiniz${first ? `, ${first}` : ''}`, 'Satış, teklif ve sipariş durumunun özeti.',
        html`<a class="hf-btn" href="#/raporlar">${icon('download')}Rapor</a>
             <a class="hf-btn hf-btn--primary" href="#/teklifler/yeni">${icon('plus')}Yeni teklif</a>`)}
      <div class="hf-grid hf-grid--kpi" id="kpis">${[1, 2, 3, 4].map(() => html`<div class="hf-skeleton hf-skeleton--card"></div>`)}</div>
      <div class="hf-split hf-mt-6">
        <section class="hf-card" aria-labelledby="ch-title">
          <div class="hf-card__head"><div><h2 class="hf-card__title" id="ch-title">Aylık ciro</h2><p class="hf-card__subtitle">2026 · KDV hariç</p></div>
            <span class="hf-badge hf-badge--success">▲ %12,4</span></div>
          <div class="hf-card__body"><hd-chart id="sales" type="line" format="money" height="240" label="2026 aylık ciro"></hd-chart></div>
        </section>
        <section class="hf-card" aria-labelledby="act-title">
          <div class="hf-card__head"><h2 class="hf-card__title" id="act-title">Son hareketler</h2></div>
          <div class="hf-card__body"><ol class="hf-timeline" id="activity"></ol></div>
        </section>
      </div>
      <section class="hf-mt-6" aria-labelledby="ord-title">
        <div class="hf-cluster hf-between"><h2 class="hf-text-lg hf-bold" id="ord-title">Son siparişler</h2><a href="#/siparisler">Tümünü gör</a></div>
        <hd-table class="hf-mt-4" id="orders" page-size="5" caption="Son siparişler"></hd-table>
      </section>`;
  },
  async mount(el, app) {
    const ctrl = new AbortController();
    const [stats, orders] = await Promise.all([
      app.data.get('examples/data/stats.json', { cache: 60000, signal: ctrl.signal }),
      app.data.get('examples/data/orders.json', { cache: 60000, signal: ctrl.signal }),
    ]);
    if (!el.isConnected || !$('#kpis', el)) return () => ctrl.abort();
    render($('#kpis', el), html`${stats.kpis.map((k) => kpiCard(k, app))}`);
    $('#sales', el).data = stats.sales;
    const list = $('#activity', el);
    list.replaceChildren(...stats.activity.map((a) => {
      const li = document.createElement('li');
      const time = document.createElement('time');
      time.dateTime = a.time;
      time.textContent = app.fmt.relative(a.time);
      li.append(time, a.text);
      return li;
    }));
    const t = $('#orders', el);
    t.columns = [
      { key: 'id', label: 'Sipariş' },
      { key: 'customer', label: 'Müşteri' },
      { key: 'date', label: 'Tarih', type: 'relative' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS_BADGES },
      { key: 'total', label: 'Tutar', type: 'money' },
    ];
    t.data = orders.slice(0, 5);
    return () => ctrl.abort();
  },
};

