import { html, render, $, on } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { cartTotals, setQty, removeFromCart } from '../../../../components/commerce.js';
import { confirmDialog } from '../../../../components/overlay.js';
import { pageHead } from '../../../_shared/ui.js';

const VAT = 0.2;

export default {
  title: 'Sepetim',
  render: () => html`${pageHead('Sepetim', 'Sepet, siparişe dönüşmeden önce fiyat ve stok açısından sunucuda yeniden doğrulanır.')}
    <div class="hf-split"><div id="lines"></div><aside class="hf-card hf-card--elevated" id="sum" aria-label="Sipariş özeti"></aside></div>`,
  async mount(el, app) {
    const dealers = await app.data.get('examples/data/b2b/dealers.json', { cache: 60000 });
    const me = dealers[0];
    const available = me.limit - me.balance;
    const paint = () => {
      if (!$('#lines', el)) return;
      const cart = app.store.get('cart') ?? [];
      const { count, subtotal } = cartTotals(cart);
      const vat = subtotal * VAT;
      render($('#lines', el), cart.length ? html`<div class="hf-table-wrap"><table class="hf-table">
        <thead><tr><th scope="col">Ürün</th><th scope="col" class="hf-num">Birim fiyat</th><th scope="col" class="hf-num">Adet</th><th scope="col" class="hf-num">Tutar</th><th scope="col"><span class="hf-sr-only">İşlem</span></th></tr></thead>
        <tbody>${cart.map((it) => html`<tr>
          <td data-label="Ürün"><div class="hf-bold">${it.name}</div><div class="hf-muted hf-text-xs">${it.id}</div></td>
          <td data-label="Birim fiyat" class="hf-num">${app.fmt.money(it.price)}</td>
          <td data-label="Adet" class="hf-num"><div class="hf-qty">
            <button type="button" data-step="-1" data-id="${it.id}" aria-label="Azalt">${icon('minus', 'hf-icon--sm')}</button>
            <input type="number" value="${it.qty}" min="1" max="999" data-qty="${it.id}" aria-label="${it.name} adedi">
            <button type="button" data-step="1" data-id="${it.id}" aria-label="Artır">${icon('plus', 'hf-icon--sm')}</button></div></td>
          <td data-label="Tutar" class="hf-num hf-bold">${app.fmt.money(it.price * it.qty)}</td>
          <td><button type="button" class="hf-btn hf-btn--ghost hf-btn--icon hf-btn--sm" data-remove="${it.id}" aria-label="${it.name} sepetten çıkar">${icon('trash', 'hf-icon--sm')}</button></td>
        </tr>`)}</tbody></table></div>`
        : html`<div class="hf-card"><div class="hf-empty">${icon('cart')}<p>Sepetiniz boş.</p><a class="hf-btn hf-btn--primary" href="#/katalog">Kataloğa git</a></div></div>`);
      const over = subtotal + vat > available;
      const row = (k, v, b = false) => html`<div class="hf-cluster hf-between"><span class="${b ? 'hf-bold' : 'hf-muted'}">${k}</span><span class="hf-num ${b ? 'hf-bold hf-text-lg' : ''}">${v}</span></div>`;
      render($('#sum', el), html`<div class="hf-card__body hf-stack">
        <h2 class="hf-card__title">Sipariş özeti</h2>
        ${row(`Ara toplam (${count} adet)`, app.fmt.money(subtotal))}${row('KDV (%20)', app.fmt.money(vat))}<hr>${row('Genel toplam', app.fmt.money(subtotal + vat), true)}
        <div class="hf-cluster hf-between hf-text-sm"><span class="hf-muted">Kullanılabilir limit</span><span class="hf-num">${app.fmt.money(available)}</span></div>
        ${over ? html`<div class="hf-alert hf-alert--warning">${icon('alert')}<span>Tutar limitinizi aşıyor. Sipariş, finans onayına düşecek.</span></div>` : ''}
        <div class="hf-field"><label class="hf-label" for="addr">Teslimat adresi</label>
          <select class="hf-select" id="addr"><option>Merkez · Nilüfer / Bursa</option><option>Şube · Gebze / Kocaeli</option></select></div>
        <button class="hf-btn hf-btn--primary hf-btn--lg hf-btn--block" type="button" data-submit ${cart.length ? '' : html`disabled`}>Siparişi gönder</button>
      </div>`);
    };
    paint();
    const offs = [
      app.store.subscribe(paint, ['cart']),
      on(el, 'click', '[data-step]', (e, b) => {
        const it = app.store.get('cart').find((c) => c.id === b.dataset.id);
        if (!it) return;
        const n = it.qty + Number(b.dataset.step);
        if (n < 1) removeFromCart(it.id); else setQty(it.id, n);
      }),
      on(el, 'change', '[data-qty]', (e, inp) => setQty(inp.dataset.qty, inp.value)),
      on(el, 'click', '[data-remove]', (e, b) => removeFromCart(b.dataset.remove)),
      on(el, 'click', '[data-submit]', async () => {
        const { subtotal } = cartTotals(app.store.get('cart'));
        const ok = await confirmDialog({ title: 'Sipariş gönderilsin mi?', message: `KDV dahil ${app.fmt.money(subtotal * (1 + VAT))} tutarında sipariş oluşturulacak.`, okText: 'Gönder' });
        if (!ok) return;
        // Gerçek projede: await app.http.post('dealer/orders', { addressId, lines }) — fiyatı sunucu hesaplar
        app.store.set('cart', []);
        app.bus.emit('toast', { message: 'Siparişiniz alındı: SP-261062. Onaylanınca e-posta ile bilgilendirileceksiniz.', type: 'success', timeout: 6000 });
        app.router.navigate('/siparislerim');
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
