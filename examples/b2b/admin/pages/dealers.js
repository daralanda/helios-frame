import { html, render, $ } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { listPage, STATUS, detailList } from '../../../_shared/ui.js';

const base = listPage({
  title: 'Bayiler',
  desc: 'Bayi kartları, grupları, temsilcileri ve risk durumları. Satıra tıklayarak ayrıntıyı açın.',
  src: 'examples/data/b2b/dealers.json',
  actions: html`<a class="hf-btn hf-btn--primary" href="#/basvurular">${icon('user')}Bayi başvuruları</a>`,
  columns: [
    { key: 'id', label: 'Kod' }, { key: 'name', label: 'Unvan' }, { key: 'city', label: 'Şehir' }, { key: 'group', label: 'Grup' },
    { key: 'rep', label: 'Temsilci' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS },
    { key: 'balance', label: 'Bakiye', type: 'money' }, { key: 'lastOrder', label: 'Son sipariş', type: 'relative' },
  ],
  filter: { key: 'status', label: 'Durum filtresi', options: ['Aktif', 'Askıda', 'Pasif'] },
  onRow(row, app, el) {
    let dlg = $('#dealer-dlg', el);
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'hf-dialog hf-dialog--drawer';
      dlg.id = 'dealer-dlg';
      dlg.setAttribute('aria-labelledby', 'dealer-dlg-t');
      el.append(dlg);
    }
    render(dlg, html`<div class="hf-dialog__head"><h2 class="hf-dialog__title" id="dealer-dlg-t">${row.name}</h2>
      <button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" data-dialog-close aria-label="Kapat">${icon('x')}</button></div>
      <div class="hf-dialog__body">${detailList([
        ['Cari kod', row.id], ['VKN', row.vkn], ['Şehir', row.city], ['Grup', row.group], ['Temsilci', row.rep], ['Durum', row.status],
        ['Risk limiti', app.fmt.money(row.limit)], ['Bakiye', app.fmt.money(row.balance)], ['Limit kullanımı', `%${row.risk}`],
      ])}
      <div class="hf-progress hf-mt-4" role="progressbar" aria-label="Limit kullanımı" aria-valuenow="${row.risk}" aria-valuemin="0" aria-valuemax="100"><span data-hf-value="${Math.min(100, row.risk)}"></span></div>
      <div class="hf-cluster hf-mt-6"><a class="hf-btn hf-btn--primary" href="#/siparisler">Siparişleri</a><a class="hf-btn" href="#/cari">Cari ekstre</a></div></div>`);
    app.hydrate(dlg);
    dlg.showModal();
  },
});

export default base;
