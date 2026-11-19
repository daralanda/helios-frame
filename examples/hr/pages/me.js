import { html, render, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, kpiCard } from '../../_shared/ui.js';

export default {
  title: 'Özetim',
  render: (app) => html`${pageHead(`Merhaba ${String(app.user?.name ?? '').split(' ')[0]}`, 'Çalışan self-servis: izin, puantaj ve bordro pusulası.',
      html`<a class="hf-btn hf-btn--primary" href="#/benim/izinler">${icon('plus')}İzin talebi</a>`)}
    <div class="hf-grid hf-grid--kpi" id="kpis"></div>
    <div class="hf-grid hf-grid--2 hf-mt-6">
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Bugün</h2></div><div class="hf-card__body">
        <ol class="hf-timeline"><li><time>08:42</time>A kapısı turnike · giriş</li><li><time>12:31</time>Yemekhane · kart okutma</li><li><time>13:14</time>A kapısı turnike · giriş</li></ol></div></section>
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Son pusulalar</h2><a class="hf-text-sm" href="#/benim/pusulalar">Tümü</a></div>
        <div class="hf-card__body"><ul class="hf-stack hf-gap-2" role="list" id="slips"></ul></div></section>
    </div>`,
  async mount(el, app) {
    const pay = await app.data.get('examples/data/hr/payroll.json', { cache: 60000 });
    if (!$('#kpis', el)) return;
    render($('#kpis', el), html`${[
      { label: 'Yıllık izin bakiyesi', value: 14, format: 'number', trend: 0, icon: 'calendar', hint: 'gün' },
      { label: 'Bu ay çalışılan', value: 13, format: 'number', trend: 0.04, icon: 'clock', hint: 'gün' },
      { label: 'Fazla mesai', value: 6.5, format: 'number', trend: 0.3, icon: 'zap', hint: 'saat · bu ay' },
      { label: 'Geç kalma', value: 1, format: 'number', trend: -0.5, icon: 'alert', invert: true, hint: 'bu ay' },
    ].map((k) => kpiCard(k, app))}`);
    render($('#slips', el), html`${pay.filter((p) => p.status !== 'Hesaplanıyor').slice(-3).reverse().map((p) => html`<li class="hf-cluster hf-between">
      <span>${icon('file')} ${p.period}</span><a class="hf-btn hf-btn--sm" href="#/benim/pusulalar">Görüntüle</a></li>`)}`);
  },
};
