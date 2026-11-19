import { html, render, $ } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { pageHead, kpiCard, kpiSkeleton, STATUS } from '../../../_shared/ui.js';

const D = 'examples/data/b2b/';

export default {
  title: 'Özet',
  render: (app) => html`
    ${pageHead(`Hoş geldiniz, ${app.user?.company ?? ''}`, 'Altın bayi · Temsilciniz: Ayşe Yılmaz (0532 123 45 67)',
      html`<a class="hf-btn" href="#/hizli-siparis">${icon('zap')}Hızlı sipariş</a><a class="hf-btn hf-btn--primary" href="#/katalog">${icon('box')}Kataloğa git</a>`)}
    <div class="hf-grid hf-grid--kpi" id="kpis">${kpiSkeleton()}</div>
    <div class="hf-split hf-mt-6">
      <section aria-labelledby="t1"><div class="hf-cluster hf-between"><h2 class="hf-text-lg hf-bold" id="t1">Son siparişlerim</h2><a href="#/siparislerim">Tümü</a></div>
        <hd-table class="hf-mt-4" id="orders" page-size="5" caption="Son siparişlerim"></hd-table></section>
      <section class="hf-card" aria-labelledby="t2"><div class="hf-card__head"><h2 class="hf-card__title" id="t2">Duyurular</h2></div>
        <div class="hf-card__body"><ol class="hf-timeline" id="news"></ol></div></section>
    </div>`,
  async mount(el, app) {
    const [dealers, orders, news] = await Promise.all([
      app.data.get(`${D}dealers.json`, { cache: 60000 }), app.data.get(`${D}my-orders.json`, { cache: 60000 }), app.data.get(`${D}announcements.json`, { cache: 60000 }),
    ]);
    if (!$('#kpis', el)) return;
    const me = dealers[0];
    render($('#kpis', el), html`${[
      { label: 'Cari bakiye', value: me.balance, format: 'money', trend: 0.06, icon: 'wallet', invert: true, hint: 'son 30 gün' },
      { label: 'Kullanılabilir limit', value: me.limit - me.balance, format: 'money', trend: -0.04, icon: 'shield', hint: `limit ${app.fmt.compact(me.limit)} ₺` },
      { label: 'Açık sipariş', value: orders.filter((o) => !['Teslim edildi', 'İptal'].includes(o.status)).length, format: 'number', trend: 0.1, icon: 'truck', hint: 'yolda / hazırlanıyor' },
      { label: 'Sadakat puanı', value: 12480, format: 'number', trend: 0.18, icon: 'award', hint: 'bu yıl' },
    ].map((k) => kpiCard(k, app))}`);
    const t = $('#orders', el);
    t.columns = [{ key: 'id', label: 'Sipariş' }, { key: 'date', label: 'Tarih', type: 'relative' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'total', label: 'Tutar', type: 'money' }];
    t.data = orders.slice(0, 5);
    render($('#news', el), html`${news.map((n) => html`<li><time datetime="${n.date}">${app.fmt.relative(n.date)}</time><strong>${n.title}</strong></li>`)}`);
  },
};
