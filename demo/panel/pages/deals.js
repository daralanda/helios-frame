import { html, render, $, on } from '../../../core/dom.js';
import { pageHead } from './_ui.js';

const STAGES = ['Yeni', 'Görüşülüyor', 'Teklif verildi', 'Kazanıldı'];

export default {
  title: 'Fırsatlar',
  render: () => html`${pageHead('Fırsatlar (CRM)', 'Satış hunisi. Kartları sürükleyip bırakın veya kart menüsünden aşama değiştirin.')}
    <div class="hf-kanban" id="board"></div>`,

  async mount(el, app) {
    let deals = await app.data.get('data/deals.json', { cache: 60000 });
    const board = $('#board', el);
    if (!board) return;

    const paint = () => render(board, html`${STAGES.map((stage) => {
      const items = deals.filter((d) => d.stage === stage);
      const sum = items.reduce((a, d) => a + d.value, 0);
      return html`<section class="hf-kanban__col" data-stage="${stage}" aria-label="${stage}">
        <div class="hf-kanban__head"><span>${stage} <span class="hf-badge">${items.length}</span></span>
          <span class="hf-muted hf-text-xs hf-num">${app.fmt.compact(sum)} ₺</span></div>
        ${items.map((d) => html`<article class="hf-kanban__card" draggable="true" data-id="${d.id}">
          <div class="hf-bold">${d.title}</div>
          <div class="hf-muted hf-text-xs">${d.customer}</div>
          <div class="hf-cluster hf-between">
            <span class="hf-bold hf-num">${app.fmt.money(d.value)}</span><span class="hf-avatar">${d.owner}</span>
          </div>
          <label class="hf-sr-only" for="st-${d.id}">Aşama</label>
          <select class="hf-select" id="st-${d.id}" data-move="${d.id}">
            ${STAGES.map((s) => html`<option ${s === d.stage ? html`selected` : ''}>${s}</option>`)}
          </select>
        </article>`)}
      </section>`;
    })}`);

    const move = (id, stage) => {
      deals = deals.map((d) => (d.id === Number(id) ? { ...d, stage } : d));
      paint();
      app.bus.emit('toast', { message: `Fırsat "${stage}" aşamasına taşındı.`, type: 'success', timeout: 2000 });
    };
    paint();

    // Sürükle-bırak (fare) + select (klavye/mobil erişilebilir alternatif)
    const offs = [
      on(board, 'change', '[data-move]', (e, s) => move(s.dataset.move, s.value)),
      on(board, 'dragstart', '[draggable]', (e, card) => { e.dataTransfer.setData('text/plain', card.dataset.id); e.dataTransfer.effectAllowed = 'move'; }),
      on(board, 'dragover', '[data-stage]', (e) => e.preventDefault()),
      on(board, 'drop', '[data-stage]', (e, col) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (/^\d+$/.test(id)) move(id, col.dataset.stage);
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
