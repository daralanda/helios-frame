import { html, render, $, on } from '../../../core/dom.js';
import { icon } from '../../../components/base.js';
import { enhanceForm } from '../../../core/validate.js';
import { pageHead } from './_ui.js';

const VAT = 0.2;

export default {
  title: 'Yeni teklif',
  render: (app) => html`${pageHead('Yeni teklif', 'Ürün ekleyin; ara toplam ve KDV otomatik hesaplanır.')}
    <form class="hf-split" id="quote-form" novalidate>
      <div class="hf-stack">
        <section class="hf-card"><div class="hf-card__body hf-form-grid">
          <div class="hf-field"><label class="hf-label" for="q-customer">Müşteri<span class="hf-req">*</span></label>
            <select class="hf-select" id="q-customer" name="customer" required><option value="">Seçiniz</option></select></div>
          <div class="hf-field"><label class="hf-label" for="q-valid">Geçerlilik tarihi<span class="hf-req">*</span></label>
            <input class="hf-input" type="date" id="q-valid" name="validUntil" required></div>
          <div class="hf-field"><label class="hf-label" for="q-currency">Para birimi</label>
            <select class="hf-select" id="q-currency" name="currency"><option>TRY</option><option>USD</option><option>EUR</option></select></div>
          <div class="hf-field"><label class="hf-label" for="q-disc">İskonto (%)</label>
            <input class="hf-input" type="number" id="q-disc" name="discount" min="0" max="50" value="0" inputmode="decimal"></div>
        </div></section>

        <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Kalemler</h2>
          <button type="button" class="hf-btn hf-btn--soft hf-btn--sm" data-add>${icon('plus', 'hf-icon--sm')}Kalem ekle</button></div>
          <div class="hf-card__body"><div class="hf-table-wrap"><table class="hf-table">
            <thead><tr><th scope="col">Ürün</th><th scope="col" class="hf-num">Adet</th><th scope="col" class="hf-num">Birim fiyat</th><th scope="col" class="hf-num">Tutar</th><th scope="col"><span class="hf-sr-only">İşlem</span></th></tr></thead>
            <tbody id="lines"></tbody>
          </table></div></div>
        </section>

        <div class="hf-field"><label class="hf-label" for="q-note">Not</label>
          <textarea class="hf-textarea" id="q-note" name="note" maxlength="1000" placeholder="Teslim ve ödeme koşulları"></textarea></div>
      </div>

      <aside class="hf-card hf-card--elevated" aria-labelledby="sum-title"><div class="hf-card__body hf-stack">
        <h2 class="hf-card__title" id="sum-title">Özet</h2>
        <dl class="hf-stack hf-gap-2" id="summary"></dl>
        <button class="hf-btn hf-btn--primary hf-btn--lg hf-btn--block" type="submit">Teklifi kaydet</button>
        <a class="hf-btn hf-btn--ghost hf-btn--block" href="#/teklifler">Vazgeç</a>
        <p class="hf-hint">Tutarlar gösterim amaçlıdır; kesin hesap sunucuda yapılır.</p>
      </div></aside>
    </form>`,

  async mount(el, app) {
    const [products, customers] = await Promise.all([
      app.data.get('examples/data/products.json', { cache: 60000 }),
      app.data.get('examples/data/customers.json', { cache: 60000 }),
    ]);
    const form = $('#quote-form', el);
    if (!form) return;
    const sel = form.customer;
    for (const c of customers.filter((x) => x.status !== 'Pasif')) sel.add(new Option(c.name, String(c.id)));
    const d = new Date(Date.now() + 15 * 864e5);
    form.validUntil.value = d.toISOString().slice(0, 10);

    let lines = [{ id: products[0].id, qty: 10 }, { id: products[1].id, qty: 1 }];
    const priceOf = (id) => products.find((p) => p.id === id)?.price ?? 0;

    const paintLines = () => render($('#lines', el), html`${lines.map((l, i) => html`<tr>
      <td data-label="Ürün"><label class="hf-sr-only" for="ln-p-${i}">Ürün</label>
        <select class="hf-select" id="ln-p-${i}" data-line="${i}" data-field="id">
          ${products.map((p) => html`<option value="${p.id}" ${p.id === l.id ? html`selected` : ''}>${p.name}</option>`)}</select></td>
      <td data-label="Adet" class="hf-num"><label class="hf-sr-only" for="ln-q-${i}">Adet</label>
        <input class="hf-input hf-num" type="number" id="ln-q-${i}" min="1" max="9999" value="${l.qty}" data-line="${i}" data-field="qty" inputmode="numeric"></td>
      <td data-label="Birim fiyat" class="hf-num">${app.fmt.money(priceOf(l.id))}</td>
      <td data-label="Tutar" class="hf-num hf-bold">${app.fmt.money(priceOf(l.id) * l.qty)}</td>
      <td><button type="button" class="hf-btn hf-btn--ghost hf-btn--icon hf-btn--sm" data-del="${i}" aria-label="Kalemi sil" ${lines.length === 1 ? html`disabled` : ''}>${icon('trash', 'hf-icon--sm')}</button></td>
    </tr>`)}`);

    const paintSummary = () => {
      const sub = lines.reduce((a, l) => a + priceOf(l.id) * l.qty, 0);
      const disc = sub * Math.min(50, Math.max(0, Number(form.discount.value) || 0)) / 100;
      const vat = (sub - disc) * VAT;
      const row = (k, v, strong) => html`<div class="hf-cluster hf-between"><dt class="${strong ? 'hf-bold' : 'hf-muted'}">${k}</dt><dd class="hf-num ${strong ? 'hf-bold hf-text-lg' : ''}">${v}</dd></div>`;
      render($('#summary', el), html`${row('Ara toplam', app.fmt.money(sub))}${row('İskonto', `- ${app.fmt.money(disc)}`)}${row('KDV (%20)', app.fmt.money(vat))}<hr>${row('Genel toplam', app.fmt.money(sub - disc + vat), true)}`);
    };
    const paint = () => { paintLines(); paintSummary(); };
    paint();

    const offs = [
      on(el, 'click', '[data-add]', () => { lines = [...lines, { id: products[0].id, qty: 1 }]; paint(); $(`#ln-p-${lines.length - 1}`, el)?.focus(); }),
      on(el, 'click', '[data-del]', (e, b) => { lines = lines.filter((_, i) => i !== Number(b.dataset.del)); paint(); }),
      on(el, 'change', '[data-line]', (e, inp) => {
        const i = Number(inp.dataset.line);
        lines = lines.map((l, j) => (j === i ? { ...l, [inp.dataset.field]: inp.dataset.field === 'qty' ? Math.max(1, Math.trunc(Number(inp.value)) || 1) : inp.value } : l));
        paint();
      }),
      on(el, 'input', '#q-disc', paintSummary),
      enhanceForm(form, {
        t: app.t,
        onSubmit: async (data) => {
          // Gerçek projede: await app.http.post('quotes', { ...data, lines });
          await new Promise((r) => setTimeout(r, 500));
          app.bus.emit('toast', { message: 'Teklif taslak olarak kaydedildi.', type: 'success' });
          app.router.navigate('/teklifler');
        },
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
