import { html, render, $, on } from '../../../core/dom.js';
import { pageHead } from '../../_shared/ui.js';

export default {
  title: 'Satış hunisi',
  render: () => html`${pageHead('Satış hunisi', 'Fırsatları sürükleyip bırakın veya karttaki listeden aşama seçin. Sütun başında toplam ve ağırlıklı tutar görünür.')}
    <div class="hf-kanban" id="board"></div>`,
  async mount(el, app) {
    const [stages, data] = await Promise.all([app.data.get('examples/data/crm/stages.json', { cache: 60000 }), app.data.get('examples/data/crm/opportunities.json', { cache: 60000 })]);
    let opps = data;
    const board = $('#board', el);
    if (!board) return undefined;
    const paint = () => {
      render(board, html`${stages.map((s) => {
        const items = opps.filter((o) => o.stage === s.name);
        const sum = items.reduce((a, o) => a + o.value, 0);
        return html`<section class="hf-kanban__col" data-stage="${s.name}" data-hf-color="${s.color}" aria-label="${s.name}">
          <div class="hf-kanban__head"><span class="hf-cluster hf-gap-2"><span class="hf-swatch" data-hf-color="${s.color}"></span>${s.name} <span class="hf-badge">${items.length}</span></span>
            <span class="hf-text-xs hf-muted hf-num" title="Ağırlıklı: ${app.fmt.money((sum * s.prob) / 100)}">${app.fmt.compact(sum)} ₺ · %${s.prob}</span></div>
          ${items.map((o) => html`<article class="hf-kanban__card" draggable="true" data-id="${o.id}">
            <div class="hf-bold">${o.name}</div><div class="hf-muted hf-text-xs">${o.company}</div>
            <div class="hf-cluster hf-between"><span class="hf-bold hf-num">${app.fmt.money(o.value)}</span><span class="hf-avatar">${o.owner}</span></div>
            <div class="hf-text-xs hf-muted">Kapanış: ${app.fmt.date(o.close)}</div>
            <label class="hf-sr-only" for="st-${o.id}">Aşama</label>
            <select class="hf-select" id="st-${o.id}" data-move="${o.id}">${stages.map((x) => html`<option ${x.name === o.stage ? html`selected` : ''}>${x.name}</option>`)}</select>
          </article>`)}
        </section>`;
      })}`);
      app.hydrate(board);
    };
    const move = (id, stage) => {
      opps = opps.map((o) => (o.id === Number(id) ? { ...o, stage } : o));
      paint();
      app.bus.emit('toast', { message: stage === 'Kazanıldı' ? 'Tebrikler! Fırsat kazanıldı.' : `Fırsat "${stage}" aşamasına taşındı.`, type: stage === 'Kaybedildi' ? 'warning' : 'success', timeout: 2200 });
    };
    paint();
    const offs = [
      on(board, 'change', '[data-move]', (e, s) => move(s.dataset.move, s.value)),
      on(board, 'dragstart', '[draggable]', (e, c) => { e.dataTransfer.setData('text/plain', c.dataset.id); e.dataTransfer.effectAllowed = 'move'; }),
      on(board, 'dragover', '[data-stage]', (e) => e.preventDefault()),
      on(board, 'drop', '[data-stage]', (e, col) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (/^\d+$/.test(id)) move(id, col.dataset.stage); }),
    ];
    return () => offs.forEach((off) => off());
  },
};
