import { html, render, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, kpiCard, kpiSkeleton, STATUS } from '../../_shared/ui.js';

const D = 'examples/data/hr/';

export default {
  title: 'PDKS paneli',
  render: () => html`${pageHead('PDKS paneli', '19 Kasım 2026 Perşembe · Merkez fabrika, bölge depo ve genel müdürlük',
      html`<a class="hf-btn" href="#/kim-iceride">${icon('users')}Kim içeride</a><a class="hf-btn hf-btn--primary" href="#/puantaj">${icon('calendar')}Puantaj</a>`)}
    <div class="hf-grid hf-grid--kpi" id="kpis">${kpiSkeleton()}</div>
    <div class="hf-split hf-mt-6">
      <section class="hf-card" aria-labelledby="t1"><div class="hf-card__head"><div><h2 class="hf-card__title" id="t1">Saatlik geçiş yoğunluğu</h2><p class="hf-card__subtitle">Bugün · tüm kapılar</p></div></div>
        <div class="hf-card__body"><hd-chart id="hours" type="bar" height="230" label="Saatlik geçiş sayısı"></hd-chart></div></section>
      <section class="hf-card" aria-labelledby="t2"><div class="hf-card__head"><h2 class="hf-card__title" id="t2">Cihaz durumu</h2><a class="hf-text-sm" href="#/cihazlar">Tümü</a></div>
        <div class="hf-card__body"><ul class="hf-stack hf-gap-2" role="list" id="devices"></ul></div></section>
    </div>
    <section class="hf-mt-6" aria-labelledby="t3"><div class="hf-cluster hf-between"><h2 class="hf-text-lg hf-bold" id="t3">Geç kalanlar ve gelmeyenler</h2><a href="#/kim-iceride">Tüm liste</a></div>
      <hd-table class="hf-mt-4" id="late" page-size="6" caption="Geç kalanlar ve gelmeyenler"></hd-table></section>`,
  async mount(el, app) {
    const [stats, pres, devices] = await Promise.all(['stats', 'presence', 'devices'].map((n) => app.data.get(`${D}${n}.json`, { cache: 60000 })));
    if (!$('#kpis', el)) return;
    render($('#kpis', el), html`${stats.kpis.map((k) => kpiCard({ ...k, hint: 'düne göre' }, app))}`);
    $('#hours', el).data = stats.hours;
    render($('#devices', el), html`${devices.map((d) => html`<li class="hf-cluster hf-between hf-gap-2">
      <span class="hf-cluster hf-gap-2">${icon('cpu')}<span><span class="hf-bold hf-text-sm">${d.name}</span><br><span class="hf-muted hf-text-xs">${d.location}</span></span></span>
      <span class="hf-badge hf-badge--dot hf-badge--${STATUS[d.status]}">${d.status}</span></li>`)}`);
    const t = $('#late', el);
    const fmtTime = new Intl.DateTimeFormat(app.config.locale, { timeStyle: 'short' });
    t.columns = [
      { key: 'name', label: 'Personel' }, { key: 'dept', label: 'Departman' }, { key: 'state', label: 'Durum', type: 'badge', badges: STATUS },
      { key: 'inTime', label: 'Giriş', render: (r) => (r.inTime ? fmtTime.format(new Date(r.inTime)) : '—') }, { key: 'door', label: 'Kapı', render: (r) => r.door ?? '—' },
    ];
    t.data = pres.filter((p) => p.state === 'Geç kaldı' || p.state === 'Gelmedi');
  },
};
