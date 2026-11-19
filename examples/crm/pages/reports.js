import { html, $ } from '../../../core/dom.js';
import { pageHead } from '../../_shared/ui.js';

const count = (rows, key) => Object.entries(rows.reduce((m, r) => ({ ...m, [r[key]]: (m[r[key]] ?? 0) + 1 }), {})).map(([label, value]) => ({ label, value }));

export default {
  title: 'Raporlar',
  render: () => html`${pageHead('Raporlar', 'Lead kaynakları ve temsilci bazlı fırsat dağılımı.')}
    <div class="hf-grid hf-grid--2">
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Lead kaynakları</h2></div><div class="hf-card__body"><hd-chart id="r1" type="bar" label="Kaynağa göre lead sayısı"></hd-chart></div></section>
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Temsilci bazlı açık fırsat</h2></div><div class="hf-card__body"><hd-chart id="r2" type="bar" format="money" label="Temsilci bazlı açık fırsat tutarı"></hd-chart></div></section>
    </div>`,
  async mount(el, app) {
    const [leads, opps] = await Promise.all([app.data.get('examples/data/crm/leads.json', { cache: 60000 }), app.data.get('examples/data/crm/opportunities.json', { cache: 60000 })]);
    if (!$('#r1', el)) return;
    $('#r1', el).data = count(leads, 'source');
    const by = {};
    for (const o of opps) if (!['Kazanıldı', 'Kaybedildi'].includes(o.stage)) by[o.owner] = (by[o.owner] ?? 0) + o.value;
    $('#r2', el).data = Object.entries(by).map(([label, value]) => ({ label, value }));
  },
};
