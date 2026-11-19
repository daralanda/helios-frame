import { html, $ } from '../../../core/dom.js';
import { pageHead } from './_ui.js';

export default {
  title: 'Raporlar',
  render: () => html`${pageHead('Raporlar', 'Yalnızca "admin" rolüne görünür (menü ve rota koruması).')}
    <div class="hf-grid hf-grid--2">
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Aylık ciro</h2></div>
        <div class="hf-card__body"><hd-chart id="r1" type="bar" format="money" label="Aylık ciro"></hd-chart></div></section>
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Kategori bazlı adet</h2></div>
        <div class="hf-card__body"><hd-chart id="r2" type="line" label="Kategori bazlı adet"></hd-chart></div></section>
    </div>`,
  async mount(el, app) {
    const s = await app.data.get('examples/data/stats.json', { cache: 60000 });
    if (!$('#r1', el)) return;
    $('#r1', el).data = s.sales;
    $('#r2', el).data = s.categories;
  },
};
