import { html, render, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { pageHead, STATUS_BADGES } from './_ui.js';

export default {
  title: 'Müşteriler',
  render: () => html`
    ${pageHead('Müşteriler', 'Bayi, kurumsal ve KOBİ müşteri kayıtları.',
      html`<button class="hf-btn" type="button" data-export>${icon('download')}CSV</button>
           <button class="hf-btn hf-btn--primary" type="button" data-dialog-open="#new-customer">${icon('plus')}Yeni müşteri</button>`)}
    <div class="hf-cluster" role="group" aria-label="Segment filtresi" id="segments">
      ${['Tümü', 'Bayi', 'Kurumsal', 'KOBİ', 'Distribütör'].map((s, i) => html`<button type="button" class="hf-btn hf-btn--sm ${i === 0 ? 'hf-btn--soft' : 'hf-btn--ghost'}" data-seg="${s}" aria-pressed="${i === 0}">${s}</button>`)}
    </div>
    <hd-table class="hf-mt-4" id="customers" page-size="10" searchable clickable caption="Müşteriler"></hd-table>

    <dialog class="hf-dialog hf-dialog--drawer" id="customer-detail" aria-labelledby="cd-title">
      <div class="hf-dialog__head"><h2 class="hf-dialog__title" id="cd-title">Müşteri</h2>
        <button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" data-dialog-close aria-label="Kapat">${icon('x')}</button></div>
      <div class="hf-dialog__body" id="cd-body"></div>
    </dialog>

    <dialog class="hf-dialog" id="new-customer" aria-labelledby="nc-title">
      <form data-hf-validate novalidate id="nc-form">
        <div class="hf-dialog__head"><h2 class="hf-dialog__title" id="nc-title">Yeni müşteri</h2></div>
        <div class="hf-dialog__body hf-form-grid">
          <div class="hf-field hf-span-full"><label class="hf-label" for="nc-name">Firma unvanı<span class="hf-req">*</span></label>
            <input class="hf-input" id="nc-name" name="name" required minlength="3"></div>
          <div class="hf-field"><label class="hf-label" for="nc-vkn">VKN<span class="hf-req">*</span></label>
            <input class="hf-input" id="nc-vkn" name="vkn" required inputmode="numeric" maxlength="10" data-rule="vkn" data-mask="digits"></div>
          <div class="hf-field"><label class="hf-label" for="nc-phone">Telefon</label>
            <input class="hf-input" id="nc-phone" name="phone" type="tel" data-rule="phone" data-mask="phone"></div>
          <div class="hf-field hf-span-full"><label class="hf-label" for="nc-iban">IBAN</label>
            <input class="hf-input" id="nc-iban" name="iban" data-rule="iban" data-mask="iban" placeholder="TR00 0000 0000 0000 0000 0000 00"></div>
        </div>
        <div class="hf-dialog__foot"><button type="button" class="hf-btn" data-dialog-close>Vazgeç</button><button class="hf-btn hf-btn--primary" type="submit">Kaydet</button></div>
      </form>
    </dialog>`,

  async mount(el, app) {
    const rows = await app.data.get('data/customers.json', { cache: 60000 });
    const table = $('#customers', el);
    if (!table) return;
    table.columns = [
      { key: 'name', label: 'Firma' },
      { key: 'city', label: 'Şehir' },
      { key: 'segment', label: 'Segment' },
      { key: 'status', label: 'Durum', type: 'badge', badges: STATUS_BADGES },
      { key: 'orders', label: 'Sipariş', type: 'number' },
      { key: 'balance', label: 'Bakiye', type: 'money' },
      { key: 'lastActivity', label: 'Son işlem', type: 'relative' },
    ];
    table.data = rows;

    const offs = [
      on(el, 'click', '[data-seg]', (e, btn) => {
        for (const b of el.querySelectorAll('[data-seg]')) {
          const on_ = b === btn;
          b.setAttribute('aria-pressed', String(on_));
          b.classList.toggle('hf-btn--soft', on_);
          b.classList.toggle('hf-btn--ghost', !on_);
        }
        const seg = btn.dataset.seg;
        table.data = seg === 'Tümü' ? rows : rows.filter((r) => r.segment === seg);
      }),
      on(el, 'hd-row', 'hd-table', (e) => {
        const c = e.detail.row;
        $('#cd-title', el).textContent = c.name;
        render($('#cd-body', el), html`<dl class="hf-stack hf-gap-2">
          ${[['Müşteri no', c.id], ['Şehir', c.city], ['Segment', c.segment], ['Durum', c.status],
             ['Toplam sipariş', app.fmt.number(c.orders)], ['Bakiye', app.fmt.money(c.balance)], ['Son işlem', app.fmt.datetime(c.lastActivity)]]
            .map(([k, v]) => html`<div class="hf-cluster hf-between"><dt class="hf-muted">${k}</dt><dd class="hf-bold">${v}</dd></div>`)}
        </dl>
        <div class="hf-cluster hf-mt-6"><a class="hf-btn hf-btn--primary" href="#/teklifler/yeni">Teklif hazırla</a><a class="hf-btn" href="#/siparisler">Siparişler</a></div>`);
        $('#customer-detail', el).showModal();
      }),
      on(el, 'click', '[data-export]', () => exportCsv(rows)),
    ];
    const form = $('#nc-form', el);
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return;
      e.preventDefault();
      form.closest('dialog').close();
      form.reset();
      app.bus.emit('toast', { message: 'Müşteri kaydedildi (demo: sunucuya gönderilmedi).', type: 'success' });
    });
    app.hydrate(el);
    return () => offs.forEach((off) => off());
  },
};

/** CSV dışa aktarma: Excel'in Türkçe karakterleri doğru açması için BOM + ';' ayırıcı.
 *  Hücreler =,+,-,@ ile başlıyorsa formül enjeksiyonuna karşı ' ile etkisizleştirilir. */
function exportCsv(rows) {
  const cols = ['id', 'name', 'city', 'segment', 'status', 'orders', 'balance'];
  const safe = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(?:\.\d+)?$/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = '﻿' + [cols.join(';'), ...rows.map((r) => cols.map((c) => safe(r[c])).join(';'))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'musteriler.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
