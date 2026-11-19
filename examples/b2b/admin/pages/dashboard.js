import { html, render, $ } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { pageHead, kpiCard, kpiSkeleton, STATUS } from '../../../_shared/ui.js';

const D = 'examples/data/b2b/';

export default {
  title: 'Özet',
  render: (app) => html`
    ${pageHead('Özet', `Günaydın ${String(app.user?.name ?? '').split(' ')[0]}. Satış, sevkiyat ve tahsilat durumu.`,
      html`<a class="hf-btn" href="#/raporlar">${icon('chart')}Raporlar</a><a class="hf-btn hf-btn--primary" href="#/onaylar">${icon('check')}Onay bekleyenler</a>`)}
    <div class="hf-grid hf-grid--kpi" id="kpis">${kpiSkeleton()}</div>
    <div class="hf-split hf-mt-6">
      <section class="hf-card" aria-labelledby="t1"><div class="hf-card__head"><div><h2 class="hf-card__title" id="t1">Aylık ciro</h2><p class="hf-card__subtitle">2026 · KDV hariç</p></div></div>
        <div class="hf-card__body"><hd-chart id="sales" type="bar" format="money" height="250" label="2026 aylık ciro"></hd-chart></div></section>
      <section class="hf-card" aria-labelledby="t2"><div class="hf-card__head"><h2 class="hf-card__title" id="t2">Onay bekleyenler</h2><a href="#/onaylar" class="hf-text-sm">Tümü</a></div>
        <div class="hf-card__body"><ul class="hf-stack hf-gap-2" role="list" id="appr"></ul></div></section>
    </div>
    <section class="hf-mt-6" aria-labelledby="t3">
      <div class="hf-cluster hf-between"><h2 class="hf-text-lg hf-bold" id="t3">Son siparişler</h2><a href="#/siparisler">Tüm siparişler</a></div>
      <hd-table class="hf-mt-4" id="orders" page-size="6" caption="Son siparişler"></hd-table>
    </section>`,
  async mount(el, app) {
    const [stats, orders, appr] = await Promise.all([
      app.data.get(`${D}stats.json`, { cache: 60000 }),
      app.data.get(`${D}orders.json`, { cache: 60000 }),
      app.data.get(`${D}approvals.json`, { cache: 60000 }),
    ]);
    if (!$('#kpis', el)) return;
    render($('#kpis', el), html`${stats.kpis.map((k) => kpiCard(k, app))}`);
    $('#sales', el).data = stats.sales;
    render($('#appr', el), html`${appr.slice(0, 5).map((a) => html`<li class="hf-cluster hf-between hf-gap-2">
      <div class="hf-grow"><div class="hf-bold hf-text-sm">${a.kind}</div><div class="hf-muted hf-text-xs hf-truncate">${a.dealer} · ${a.step}</div></div>
      <span class="hf-num hf-text-sm hf-bold">${app.fmt.money(a.amount)}</span></li>`)}`);
    const t = $('#orders', el);
    t.columns = [
      { key: 'id', label: 'Sipariş' }, { key: 'dealer', label: 'Bayi' }, { key: 'date', label: 'Tarih', type: 'relative' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'total', label: 'Tutar', type: 'money' },
    ];
    t.data = orders.slice(0, 6);
  },
};
