import { html, render, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead } from '../../_shared/ui.js';

export default {
  title: 'Pusulalarım',
  render: () => html`${pageHead('Pusulalarım', 'Bordro pusulalarınız. İtirazlar bordro uzmanına iletilir ve kayıt altına alınır.')}<div class="hf-grid" id="list"></div>`,
  async mount(el, app) {
    const pay = await app.data.get('examples/data/hr/payroll.json', { cache: 60000 });
    if (!$('#list', el)) return undefined;
    render($('#list', el), html`${pay.filter((p) => p.status !== 'Hesaplanıyor').reverse().map((p, i) => {
      const net = 42150 + i * 310;
      return html`<article class="hf-card"><div class="hf-card__head"><div><h2 class="hf-card__title">${p.period}</h2><p class="hf-card__subtitle">Ödeme: ayın son iş günü</p></div>${icon('file')}</div>
        <div class="hf-card__body hf-stack hf-gap-2">
          <div class="hf-cluster hf-between"><span class="hf-muted">Brüt</span><span class="hf-num">${app.fmt.money(net / 0.71)}</span></div>
          <div class="hf-cluster hf-between"><span class="hf-muted">Kesintiler</span><span class="hf-num">${app.fmt.money(net / 0.71 - net)}</span></div>
          <div class="hf-cluster hf-between"><span class="hf-bold">Net</span><span class="hf-num hf-bold">${app.fmt.money(net)}</span></div></div>
        <div class="hf-card__foot"><button type="button" class="hf-btn hf-btn--ghost hf-btn--sm" data-objection>İtiraz et</button><button type="button" class="hf-btn hf-btn--sm" data-pdf>${icon('download', 'hf-icon--sm')}PDF</button></div></article>`;
    })}`);
    const offs = [
      on(el, 'click', '[data-pdf]', () => app.bus.emit('toast', { message: 'Demo: Gerçek projede imzalı PDF indirilir.', type: 'info' })),
      on(el, 'click', '[data-objection]', () => app.bus.emit('toast', { message: 'İtiraz kaydınız bordro uzmanına iletildi.', type: 'success' })),
    ];
    return () => offs.forEach((off) => off());
  },
};
