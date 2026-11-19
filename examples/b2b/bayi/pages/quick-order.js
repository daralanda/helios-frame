import { html, render, $, on } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { addToCart } from '../../../../components/commerce.js';
import { pageHead } from '../../../_shared/ui.js';

export default {
  title: 'Hızlı sipariş',
  render: () => html`${pageHead('Hızlı sipariş', 'Ürün kodu ve adetle satır satır girin ya da Excel\'den "KOD;ADET" biçiminde yapıştırın.')}
    <div class="hf-split">
      <section class="hf-card"><div class="hf-card__body">
        <datalist id="skus"></datalist>
        <div class="hf-table-wrap"><table class="hf-table"><thead><tr><th scope="col">Ürün kodu</th><th scope="col">Ürün</th><th scope="col" class="hf-num">Adet</th><th scope="col" class="hf-num">Tutar</th></tr></thead>
          <tbody id="rows"></tbody></table></div>
        <div class="hf-cluster hf-mt-4"><button type="button" class="hf-btn hf-btn--soft" data-addrow>${icon('plus', 'hf-icon--sm')}Satır ekle</button>
          <button type="button" class="hf-btn hf-btn--primary" data-tocart>${icon('cart', 'hf-icon--sm')}Sepete ekle</button></div>
      </div></section>
      <section class="hf-card"><div class="hf-card__body hf-stack">
        <h2 class="hf-card__title">Toplu yapıştır</h2>
        <label class="hf-label" for="paste">Her satıra bir ürün: KOD;ADET</label>
        <textarea class="hf-textarea" id="paste" rows="8" placeholder="SE-101;10&#10;AG-107;2"></textarea>
        <button type="button" class="hf-btn" data-parse>Satırlara aktar</button>
      </div></section>
    </div>`,
  async mount(el, app) {
    const products = await app.data.get('examples/data/b2b/products.json', { cache: 60000 });
    if (!$('#rows', el)) return undefined;
    const bySku = new Map(products.map((p) => [p.sku.toLocaleUpperCase('tr-TR'), p]));
    render($('#skus', el), html`${products.map((p) => html`<option value="${p.sku}">${p.name}</option>`)}`);
    let rows = [{ sku: '', qty: 1 }, { sku: '', qty: 1 }, { sku: '', qty: 1 }];
    const paint = () => render($('#rows', el), html`${rows.map((r, i) => {
      const p = bySku.get(r.sku.trim().toLocaleUpperCase('tr-TR'));
      return html`<tr>
        <td data-label="Ürün kodu"><label class="hf-sr-only" for="sku-${i}">Ürün kodu</label><input class="hf-input" id="sku-${i}" list="skus" data-i="${i}" data-f="sku" value="${r.sku}" autocomplete="off"></td>
        <td data-label="Ürün">${p ? p.name : r.sku ? html`<span class="hf-error">Kod bulunamadı</span>` : html`<span class="hf-subtle">—</span>`}</td>
        <td data-label="Adet" class="hf-num"><label class="hf-sr-only" for="qty-${i}">Adet</label><input class="hf-input hf-num" id="qty-${i}" type="number" min="1" max="999" data-i="${i}" data-f="qty" value="${r.qty}"></td>
        <td data-label="Tutar" class="hf-num">${p ? app.fmt.money(p.dealerPrice * r.qty) : ''}</td></tr>`;
    })}`);
    paint();
    const offs = [
      on(el, 'change', '[data-f]', (e, inp) => {
        const i = Number(inp.dataset.i);
        rows[i] = { ...rows[i], [inp.dataset.f]: inp.dataset.f === 'qty' ? Math.max(1, Math.trunc(Number(inp.value)) || 1) : inp.value };
        paint();
      }),
      on(el, 'click', '[data-addrow]', () => { rows = [...rows, { sku: '', qty: 1 }]; paint(); $(`#sku-${rows.length - 1}`, el)?.focus(); }),
      on(el, 'click', '[data-parse]', () => {
        const parsed = $('#paste', el).value.split(/\r?\n/).map((l) => l.split(/[;,\t]/)).filter((p) => p[0]?.trim())
          .map(([sku, qty]) => ({ sku: sku.trim(), qty: Math.max(1, Math.trunc(Number(qty)) || 1) }));
        if (parsed.length) { rows = [...rows.filter((r) => r.sku), ...parsed]; paint(); }
      }),
      on(el, 'click', '[data-tocart]', () => {
        let n = 0;
        for (const r of rows) {
          const p = bySku.get(r.sku.trim().toLocaleUpperCase('tr-TR'));
          if (p && p.stock > 0) { addToCart({ id: p.id, name: p.name, price: p.dealerPrice }, r.qty); n++; }
        }
        if (n) app.router.navigate('/sepet');
        else app.bus.emit('toast', { message: 'Geçerli ürün kodu girilmedi.', type: 'warning' });
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
