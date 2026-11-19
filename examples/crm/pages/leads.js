import { html, render, $ } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { listPage, STATUS, detailList } from '../../_shared/ui.js';

export default listPage({
  title: "Lead'ler",
  desc: 'Web formu, fuar ve kampanyalardan gelen adaylar. Satıra tıklayıp fırsata dönüştürün.',
  src: 'examples/data/crm/leads.json',
  columns: [
    { key: 'name', label: 'Ad soyad' }, { key: 'company', label: 'Firma' }, { key: 'source', label: 'Kaynak' }, { key: 'city', label: 'Şehir' },
    { key: 'owner', label: 'Sorumlu' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }, { key: 'created', label: 'Oluşturma', type: 'relative' },
  ],
  filter: { key: 'status', label: 'Durum', options: ['Yeni', 'İletişime geçildi', 'Nitelikli', 'Nitelikli değil', 'Dönüştürüldü'] },
  onRow(row, app, el) {
    let dlg = $('#lead-dlg', el);
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'hf-dialog';
      dlg.id = 'lead-dlg';
      dlg.setAttribute('aria-labelledby', 'lead-dlg-t');
      el.append(dlg);
      dlg.addEventListener('click', (e) => {
        if (e.target.closest('[data-convert]')) {
          dlg.close();
          app.bus.emit('toast', { message: `${dlg.dataset.name} fırsata dönüştürüldü; firma ve kişi kaydı açıldı.`, type: 'success' });
          app.router.navigate('/huni');
        }
      });
    }
    dlg.dataset.name = row.name;
    render(dlg, html`<div class="hf-dialog__head"><h2 class="hf-dialog__title" id="lead-dlg-t">${row.name}</h2>
      <button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" data-dialog-close aria-label="Kapat">${icon('x')}</button></div>
      <div class="hf-dialog__body">${detailList([['Firma', row.company], ['Kaynak', row.source], ['Şehir', row.city], ['Sorumlu', row.owner], ['Durum', row.status], ['Oluşturma', app.fmt.date(row.created)]])}</div>
      <div class="hf-dialog__foot"><button type="button" class="hf-btn" data-dialog-close>Kapat</button>
        <button type="button" class="hf-btn hf-btn--primary" data-convert ${row.status === 'Dönüştürüldü' ? html`disabled` : ''}>${icon('briefcase', 'hf-icon--sm')}Fırsata dönüştür</button></div>`);
    dlg.showModal();
  },
});
