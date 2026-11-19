import { html, render, $ } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { pageHead, detailList } from '../../../_shared/ui.js';

export default {
  title: 'Cari hesabım',
  render: () => html`${pageHead('Cari hesabım', 'Hesap ekstresi; borç, alacak ve yürüyen bakiye.',
      html`<a class="hf-btn hf-btn--primary" href="#/odeme">${icon('card')}Ödeme yap</a>`)}
    <div class="hf-split"><hd-table id="ledger" page-size="10" searchable caption="Hesap ekstresi"></hd-table>
      <aside class="hf-card hf-card--brand" id="sum" aria-label="Hesap özeti"></aside></div>`,
  async mount(el, app) {
    const [rows, dealers] = await Promise.all([app.data.get('examples/data/b2b/ledger.json', { cache: 60000 }), app.data.get('examples/data/b2b/dealers.json', { cache: 60000 })]);
    const t = $('#ledger', el);
    if (!t) return;
    t.columns = [
      { key: 'date', label: 'Tarih', type: 'date' }, { key: 'doc', label: 'Belge' }, { key: 'desc', label: 'Açıklama' },
      { key: 'debit', label: 'Borç', type: 'money', render: (r) => (r.debit ? app.fmt.money(r.debit) : '') },
      { key: 'credit', label: 'Alacak', type: 'money', render: (r) => (r.credit ? app.fmt.money(r.credit) : '') },
      { key: 'balance', label: 'Bakiye', type: 'money' },
    ];
    t.data = [...rows].reverse();
    const me = dealers[0];
    render($('#sum', el), html`<div class="hf-card__body hf-stack">
      <p class="hf-card__subtitle">Güncel bakiye</p><div class="hf-stat__value">${app.fmt.money(me.balance)}</div>
      ${detailList([['Risk limiti', app.fmt.money(me.limit)], ['Kullanılabilir', app.fmt.money(me.limit - me.balance)], ['Vade', '60 gün'], ['Son ödeme', app.fmt.date(rows.findLast((r) => r.credit)?.date)]])}
    </div>`);
  },
};
