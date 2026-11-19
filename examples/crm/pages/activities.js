import { html, render, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead } from '../../_shared/ui.js';

const NOW = new Date('2026-11-19T09:30:00');
const TYPE_ICON = { Görev: 'check', Arama: 'phone', Toplantı: 'users', 'E-posta': 'mail', Not: 'edit' };

export default {
  title: 'Aktiviteler',
  render: () => html`${pageHead('Aktiviteler', 'Görev, arama, toplantı ve notlar. Takvim aboneliği (iCal) ile telefonunuzda da görünür.')}
    <hd-tabs label="Aktivite görünümü" id="tabs">
      <section data-tab="Gecikenler" id="late"></section>
      <section data-tab="Bugün" id="today"></section>
      <section data-tab="Yaklaşanlar" id="soon"></section>
      <section data-tab="Tamamlananlar" id="done"></section>
    </hd-tabs>`,
  async mount(el, app) {
    let acts = await app.data.get('examples/data/crm/activities.json', { cache: 60000 });
    if (!$('#late', el)) return undefined;
    const isToday = (d) => new Date(d).toDateString() === NOW.toDateString();
    const groups = () => ({
      late: acts.filter((a) => !a.done && new Date(a.due) < NOW && !isToday(a.due)),
      today: acts.filter((a) => !a.done && isToday(a.due)),
      soon: acts.filter((a) => !a.done && new Date(a.due) > NOW && !isToday(a.due)),
      done: acts.filter((a) => a.done),
    });
    const item = (a) => html`<li class="hf-card hf-card--flat"><div class="hf-card__body hf-cluster hf-gap-2">
      <span class="hf-stat__icon">${icon(TYPE_ICON[a.type] ?? 'check')}</span>
      <div class="hf-grow"><div class="hf-bold">${a.subject}</div><div class="hf-muted hf-text-sm">${a.company} · ${a.owner}</div></div>
      <div class="hf-text-sm hf-num">${app.fmt.datetime(a.due)}</div>
      ${a.done ? html`<span class="hf-badge hf-badge--success">Tamamlandı</span>` : html`<button type="button" class="hf-btn hf-btn--sm" data-done="${a.id}">${icon('check', 'hf-icon--sm')}Tamamla</button>`}
    </div></li>`;
    const paint = () => {
      const g = groups();
      for (const [k, list] of Object.entries(g)) {
        render($(`#${k}`, el), list.length ? html`<ul class="hf-stack hf-gap-2" role="list">${list.map(item)}</ul>` : html`<div class="hf-empty">${icon('check')}<p>Kayıt yok.</p></div>`);
      }
      const tabs = el.querySelectorAll('.hf-tabs__tab');
      ['Gecikenler', 'Bugün', 'Yaklaşanlar', 'Tamamlananlar'].forEach((n, i) => { if (tabs[i]) tabs[i].textContent = `${n} (${Object.values(g)[i].length})`; });
    };
    paint();
    return on(el, 'click', '[data-done]', (e, b) => {
      acts = acts.map((a) => (String(a.id) === b.dataset.done ? { ...a, done: true } : a));
      paint();
      app.bus.emit('toast', { message: 'Aktivite tamamlandı.', type: 'success', timeout: 2000 });
    });
  },
};
