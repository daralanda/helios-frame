import { html, render, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead } from '../../_shared/ui.js';

export default {
  title: 'Organizasyon şeması',
  render: () => html`${pageHead('Organizasyon şeması', 'Departmanlar, pozisyonlar ve kadro dağılımı.')}
    <div class="org"><div class="org__root hf-card hf-card--brand"><div class="hf-card__body hf-center"><strong>Genel müdürlük</strong><br><span class="hf-text-sm">Helios Diji Sanayi A.Ş.</span></div></div>
    <div class="hf-grid org__depts" id="depts"></div></div>`,
  async mount(el, app) {
    const emps = await app.data.get('examples/data/hr/employees.json', { cache: 60000 });
    if (!$('#depts', el)) return;
    const by = {};
    for (const e of emps) (by[e.dept] ??= []).push(e);
    render($('#depts', el), html`${Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([d, list]) => {
      const titles = Object.entries(list.reduce((m, e) => ({ ...m, [e.title]: (m[e.title] ?? 0) + 1 }), {}));
      return html`<section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">${d}</h2><span class="hf-badge hf-badge--primary">${icon('users', 'hf-icon--sm')}${list.length}</span></div>
        <div class="hf-card__body"><ul class="hf-stack hf-gap-2" role="list">${titles.map(([t, n]) => html`<li class="hf-cluster hf-between hf-text-sm"><span>${t}</span><span class="hf-muted">${n} kişi</span></li>`)}</ul></div></section>`;
    })}`);
  },
};
