import { html, render, $ } from '../../../core/dom.js';
import { pageHead } from '../../_shared/ui.js';

const CLS = { Sabah: 'info', Akşam: 'warning', Gece: 'primary', İzin: 'success' };

export default {
  title: 'Vardiya planı',
  render: () => html`${pageHead('Vardiya planı', 'Haftalık vardiya dağılımı. Değişim talepleri çalışan uygulamasından gelir.')}
    <div class="hf-table-wrap"><table class="hf-table" id="plan"></table></div>`,
  async mount(el, app) {
    const s = await app.data.get('examples/data/hr/shifts.json', { cache: 60000 });
    if (!$('#plan', el)) return;
    render($('#plan', el), html`<caption class="hf-sr-only">Vardiya planı ${s.week}</caption>
      <thead><tr><th scope="col">Personel</th>${s.days.map((d) => html`<th scope="col">${d}</th>`)}</tr></thead>
      <tbody>${s.rows.map((r) => html`<tr><th scope="row"><span class="hf-bold">${r.name}</span><br><span class="hf-muted hf-text-xs">${r.dept}</span></th>
        ${r.week.map((w, i) => html`<td data-label="${s.days[i]}"><span class="hf-badge hf-badge--${CLS[w]}">${w}</span></td>`)}</tr>`)}</tbody>`);
  },
};
