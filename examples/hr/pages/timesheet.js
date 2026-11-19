import { html, render, $ } from '../../../core/dom.js';
import { pageHead } from '../../_shared/ui.js';

/** Puantaj ızgarası: personel x gün. Kodlar renkli hücrelerle gösterilir; boş hücreler gelecek günlerdir. */
export default {
  title: (p) => (location.hash.startsWith('#/benim') ? 'Puantajım' : 'Puantaj'),
  render: () => html`${pageHead(location.hash.startsWith('#/benim') ? 'Puantajım' : 'Puantaj · Kasım 2026', 'Günlük hesaplanan devam durumu. Düzeltme talepleri onay akışından geçer.')}
    <div class="hf-cluster hf-gap-2" id="legend" aria-label="Kodlar"></div>
    <div class="hf-table-wrap hf-mt-4"><table class="hf-table ts-grid" id="grid"></table></div>`,
  async mount(el, app) {
    const ts = await app.data.get('examples/data/hr/timesheet.json', { cache: 60000 });
    if (!$('#grid', el)) return;
    const mine = location.hash.startsWith('#/benim');
    const rows = mine ? ts.rows.slice(0, 1) : ts.rows;
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const wd = (d) => new Date(2026, 10, d).getDay();
    render($('#legend', el), html`${Object.entries(ts.legend).map(([k, v]) => html`<span class="hf-cluster hf-gap-2 hf-text-sm"><span class="ts-code ts-${k}">${k}</span>${v}</span>`)}`);
    const sum = (r, c) => r.days.filter((x) => x === c).length;
    render($('#grid', el), html`<thead><tr><th scope="col" class="ts-name">Personel</th>
        ${days.map((d) => html`<th scope="col" class="ts-day ${[0, 6].includes(wd(d)) ? 'ts-weekend' : ''}">${d}</th>`)}
        <th scope="col" class="hf-num">Çalışılan</th><th scope="col" class="hf-num">FM</th></tr></thead>
      <tbody>${rows.map((r) => html`<tr><th scope="row" class="ts-name"><span class="hf-bold">${r.name}</span><br><span class="hf-muted hf-text-xs">${r.dept}</span></th>
        ${r.days.map((c, i) => html`<td class="ts-day ${[0, 6].includes(wd(i + 1)) ? 'ts-weekend' : ''}">${c ? html`<span class="ts-code ts-${c}" title="${ts.legend[c]}">${c}</span>` : ''}</td>`)}
        <td class="hf-num">${sum(r, 'N') + sum(r, 'FM') + sum(r, 'G')}</td><td class="hf-num">${sum(r, 'FM')}</td></tr>`)}</tbody>`);
  },
};
