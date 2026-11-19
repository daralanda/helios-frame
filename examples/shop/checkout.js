/** Ödeme sayfası: sepet özetini çizer, form geçerliyse (demo) onay bildirimi gösterir. */
import { ready } from '../../core/app.js';
import { html, render, $ } from '../../core/dom.js';
import { cartTotals } from '../../components/commerce.js';

const app = await ready;
const SHIPPING_FREE_FROM = 2500;

function paint() {
  const cart = app.store.get('cart') ?? [];
  const { count, subtotal } = cartTotals(cart);
  const shipping = subtotal === 0 || subtotal >= SHIPPING_FREE_FROM ? 0 : 89.9;
  const row = (k, v, strong = false) => html`<div class="hf-cluster hf-between"><span class="${strong ? 'hf-bold' : 'hf-muted'}">${k}</span><span class="hf-num ${strong ? 'hf-bold hf-text-lg' : ''}">${v}</span></div>`;
  render($('#summary'), cart.length ? html`
    <ul class="hf-stack hf-gap-2" role="list">${cart.map((it) => html`<li class="hf-cluster hf-between hf-text-sm"><span>${it.qty} × ${it.name}</span><span class="hf-num">${app.fmt.money(it.price * it.qty)}</span></li>`)}</ul>
    <hr>
    ${row(`Ara toplam (${app.t('cart.items', { n: count })})`, app.fmt.money(subtotal))}
    ${row('Kargo', shipping ? app.fmt.money(shipping) : 'Ücretsiz')}
    ${row('Toplam', app.fmt.money(subtotal + shipping), true)}`
    : html`<p class="hf-muted">Sepetiniz boş. <a href="./">Alışverişe dön</a></p>`);
}
paint();
app.store.subscribe(paint, ['cart']);

$('#checkout').addEventListener('submit', (e) => {
  if (e.defaultPrevented) return; // doğrulama hatası
  e.preventDefault();
  if (!(app.store.get('cart') ?? []).length) {
    app.bus.emit('toast', { message: 'Sepetiniz boş.', type: 'warning' });
    return;
  }
  // Gerçek projede: sunucu siparişi oluşturur ve bankanın 3D Secure sayfasına yönlendirir.
  app.bus.emit('toast', { message: 'Demo: sipariş oluşturuldu, gerçek projede bankanın 3D Secure sayfasına yönlendirilirsiniz.', type: 'success', timeout: 6000 });
});
