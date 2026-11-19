import { html, $ } from '../../../../core/dom.js';
import { pageHead } from '../../../_shared/ui.js';

export default {
  title: 'Genel özet',
  render: () => html`${pageHead('Genel özet', 'Satış, grup ve kategori dağılımları.')}
    <div class="hf-grid hf-grid--2">
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Aylık ciro trendi</h2></div>
        <div class="hf-card__body"><hd-chart id="r1" type="line" format="money" label="Aylık ciro"></hd-chart></div></section>
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Bayi grubuna göre sipariş</h2></div>
        <div class="hf-card__body"><hd-chart id="r2" type="bar" label="Bayi grubuna göre sipariş adedi"></hd-chart></div></section>
    </div>`,
  async mount(el, app) {
    const s = await app.data.get('examples/data/b2b/stats.json', { cache: 60000 });
    if (!$('#r1', el)) return;
    $('#r1', el).data = s.sales;
    $('#r2', el).data = s.byGroup;
  },
};
