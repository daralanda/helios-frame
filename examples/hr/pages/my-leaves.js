import { html, $, on } from '../../../core/dom.js';
import { enhanceForm } from '../../../core/validate.js';
import { pageHead, STATUS } from '../../_shared/ui.js';

export default {
  title: 'İzinlerim',
  render: () => html`${pageHead('İzinlerim', 'Yıllık izin bakiyeniz: 14 gün. Talepler yöneticinize ve İK\'ya iletilir.')}
    <div class="hf-split">
      <hd-table id="mine" page-size="8" caption="İzin taleplerim"></hd-table>
      <form class="hf-card hf-card--elevated" id="req" novalidate><div class="hf-card__body hf-stack">
        <h2 class="hf-card__title">Yeni izin talebi</h2>
        <div class="hf-field"><label class="hf-label" for="type">İzin türü<span class="hf-req">*</span></label>
          <select class="hf-select" id="type" name="type" required><option value="">Seçiniz</option><option>Yıllık izin</option><option>Mazeret izni</option><option>Doğum günü izni</option><option>Ücretsiz izin</option></select></div>
        <div class="hf-form-grid">
          <div class="hf-field"><label class="hf-label" for="start">Başlangıç<span class="hf-req">*</span></label><input class="hf-input" type="date" id="start" name="start" required min="2026-11-19"></div>
          <div class="hf-field"><label class="hf-label" for="end">Bitiş<span class="hf-req">*</span></label><input class="hf-input" type="date" id="end" name="end" required min="2026-11-19"></div>
        </div>
        <div class="hf-field"><label class="hf-label" for="note">Açıklama</label><textarea class="hf-textarea" id="note" name="note" maxlength="300"></textarea></div>
        <button class="hf-btn hf-btn--primary" type="submit">Talep gönder</button>
      </div></form>
    </div>`,
  async mount(el, app) {
    const all = await app.data.get('examples/data/hr/leaves.json', { cache: 60000 });
    const t = $('#mine', el);
    if (!t) return undefined;
    let mine = all.slice(0, 4).map((l) => ({ ...l, name: app.user?.name }));
    t.columns = [{ key: 'type', label: 'Tür' }, { key: 'start', label: 'Başlangıç', type: 'date' }, { key: 'end', label: 'Bitiş', type: 'date' }, { key: 'days', label: 'Gün', type: 'number' }, { key: 'status', label: 'Durum', type: 'badge', badges: STATUS }];
    t.data = mine;
    const form = $('#req', el);
    const syncMin = on(form, 'change', '#start', (e) => { form.end.min = e.target.value; });
    const off = enhanceForm(form, {
      t: app.t,
      onSubmit: async (d) => {
        const days = Math.round((new Date(d.end) - new Date(d.start)) / 864e5) + 1;
        if (days < 1) { app.bus.emit('toast', { message: 'Bitiş tarihi başlangıçtan önce olamaz.', type: 'danger' }); return; }
        mine = [{ id: Date.now(), type: d.type, start: d.start, end: d.end, days, status: 'Onay bekliyor' }, ...mine];
        t.data = mine;
        form.reset();
        app.bus.emit('toast', { message: `${days} günlük izin talebiniz yöneticinize iletildi.`, type: 'success' });
      },
    });
    return () => { off(); syncMin(); };
  },
};
