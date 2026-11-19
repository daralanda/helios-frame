import { html, render, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, kpiCard, kpiSkeleton } from '../../_shared/ui.js';

const D = 'examples/data/crm/';
const NOW = new Date('2026-11-19T09:30:00');

export default {
  title: 'Gösterge paneli',
  render: () => html`${pageHead('Gösterge paneli', 'Satış hunisi, bugünkü işler ve kapanmak üzere olan fırsatlar.',
      html`<a class="hf-btn" href="#/leadler">${icon('user')}Lead'ler</a><a class="hf-btn hf-btn--primary" href="#/huni">${icon('briefcase')}Satış hunisi</a>`)}
    <div class="hf-grid hf-grid--kpi" id="kpis">${kpiSkeleton()}</div>
    <div class="hf-split hf-mt-6">
      <section class="hf-card" aria-labelledby="t1"><div class="hf-card__head"><div><h2 class="hf-card__title" id="t1">Aşamalara göre huni</h2><p class="hf-card__subtitle">Toplam fırsat tutarı</p></div></div>
        <div class="hf-card__body"><hd-chart id="funnel" type="bar" format="money" height="240" label="Aşamalara göre fırsat tutarı"></hd-chart></div></section>
      <section class="hf-card" aria-labelledby="t2"><div class="hf-card__head"><h2 class="hf-card__title" id="t2">Bugün ve gecikenler</h2><a class="hf-text-sm" href="#/aktiviteler">Tümü</a></div>
        <div class="hf-card__body"><ul class="hf-stack hf-gap-2" role="list" id="todo"></ul></div></section>
    </div>
    <section class="hf-mt-6" aria-labelledby="t3"><h2 class="hf-text-lg hf-bold" id="t3">Bu ay kapanacak fırsatlar</h2>
      <hd-table class="hf-mt-4" id="closing" page-size="5" caption="Bu ay kapanacak fırsatlar"></hd-table></section>`,
  async mount(el, app) {
    const [opps, stages, acts, leads] = await Promise.all(['opportunities', 'stages', 'activities', 'leads'].map((n) => app.data.get(`${D}${n}.json`, { cache: 60000 })));
    if (!$('#kpis', el)) return undefined;
    const open = opps.filter((o) => !['Kazanıldı', 'Kaybedildi'].includes(o.stage));
    const prob = Object.fromEntries(stages.map((s) => [s.name, s.prob]));
    const weighted = open.reduce((a, o) => a + (o.value * prob[o.stage]) / 100, 0);
    const today = (d) => new Date(d).toDateString() === NOW.toDateString();
    let todo = acts.filter((a) => !a.done && (today(a.due) || new Date(a.due) < NOW));
    render($('#kpis', el), html`${[
      { label: 'Açık fırsat tutarı', value: open.reduce((a, o) => a + o.value, 0), format: 'money', trend: 0.09, icon: 'briefcase', hint: `${open.length} fırsat` },
      { label: 'Ağırlıklı huni', value: Math.round(weighted), format: 'money', trend: 0.05, icon: 'chart', hint: 'olasılıkla çarpılmış' },
      { label: 'Kazanılan (bu ay)', value: opps.filter((o) => o.stage === 'Kazanıldı').reduce((a, o) => a + o.value, 0), format: 'money', trend: 0.21, icon: 'award' },
      { label: 'Yeni lead', value: leads.filter((l) => l.status === 'Yeni').length, format: 'number', trend: 0.12, icon: 'user', hint: 'son 45 gün' },
    ].map((k) => kpiCard(k, app))}`);
    $('#funnel', el).data = stages.filter((s) => s.name !== 'Kaybedildi').map((s) => ({ label: s.name, value: opps.filter((o) => o.stage === s.name).reduce((a, o) => a + o.value, 0) }));
    const paintTodo = () => render($('#todo', el), todo.length ? html`${todo.slice(0, 6).map((a) => {
      const late = new Date(a.due) < NOW && !today(a.due);
      return html`<li class="hf-cluster hf-gap-2">
        <label class="hf-check hf-grow"><input type="checkbox" data-done="${a.id}"><span><strong>${a.subject}</strong> · <span class="hf-muted">${a.company}</span><br>
          <span class="hf-text-xs ${late ? 'hf-badge hf-badge--danger' : 'hf-muted'}">${a.type} · ${app.fmt.relative(a.due)}</span></span></label></li>`;
    })}` : html`<li class="hf-empty">${icon('check')}<p>Bugün için iş kalmadı.</p></li>`);
    paintTodo();
    const t = $('#closing', el);
    t.columns = [{ key: 'name', label: 'Fırsat' }, { key: 'company', label: 'Firma' }, { key: 'stage', label: 'Aşama' }, { key: 'close', label: 'Kapanış', type: 'date' }, { key: 'value', label: 'Tutar', type: 'money' }];
    t.data = open.filter((o) => o.close.startsWith('2026-11') || o.close.startsWith('2026-12')).sort((a, b) => a.close.localeCompare(b.close));
    const off = on(el, 'change', '[data-done]', (e, cb) => {
      todo = todo.filter((a) => String(a.id) !== cb.dataset.done);
      app.bus.emit('toast', { message: 'Aktivite tamamlandı olarak işaretlendi.', type: 'success', timeout: 2000 });
      paintTodo();
    });
    return off;
  },
};
