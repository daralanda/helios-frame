import { Component } from '../../core/component.js';
import { html, formatMoney } from '../../core/dom.js';
import { cartTotals, setQty, removeItem, clearCart } from '../../store/cart.js';

export default class CartPage extends Component {
  static layout = 'shop';
  static meta = { title: 'Sepet' };

  beforeMount() {
    this.watch(this.ctx.store, (s) => s.cart, () => this.update());

    const qtyOf = (id) => this.ctx.store.state.cart.items.find((i) => String(i.id) === String(id))?.qty ?? 0;
    this.on('click', '[data-inc]', (e, el) => setQty(this.ctx.store, Number(el.dataset.inc), qtyOf(el.dataset.inc) + 1));
    this.on('click', '[data-dec]', (e, el) => setQty(this.ctx.store, Number(el.dataset.dec), qtyOf(el.dataset.dec) - 1));
    this.on('click', '[data-remove]', (e, el) => removeItem(this.ctx.store, Number(el.dataset.remove)));
    this.on('click', '[data-clear]', () => clearCart(this.ctx.store));
  }

  render() {
    const state = this.ctx.store.state;
    const { items } = state.cart;
    const { currency } = this.ctx.config.shop;
    const money = (n) => formatMoney(n, currency);

    if (!items.length) {
      return html`
        <div class="text-center py-5">
          <div class="display-3">🛒</div>
          <h1 class="h4 mt-3">Sepetiniz boş</h1>
          <a class="btn btn-primary mt-2" href="${this.href('/shop')}">Alışverişe başla</a>
        </div>`;
    }

    const totals = cartTotals(state);
    return html`
      <h1 class="h3 mb-4">Sepetim <small class="text-body-secondary">(${totals.count} ürün)</small></h1>
      <div class="row g-4">
        <div class="col-lg-8">
          <ul class="list-group">
            ${items.map((i) => html`
              <li class="list-group-item d-flex align-items-center gap-3">
                <div class="fs-2" aria-hidden="true">${i.emoji}</div>
                <div class="flex-grow-1">
                  <a class="fw-semibold text-reset text-decoration-none" href="${this.href(`/shop/${i.slug}`)}">${i.name}</a>
                  <div class="small text-body-secondary">${money(i.price)}</div>
                </div>
                <div class="btn-group btn-group-sm" role="group" aria-label="Adet">
                  <button class="btn btn-outline-secondary" data-dec="${i.id}" aria-label="Azalt">−</button>
                  <span class="btn btn-outline-secondary disabled">${i.qty}</span>
                  <button class="btn btn-outline-secondary" data-inc="${i.id}" aria-label="Arttır">+</button>
                </div>
                <div class="fw-semibold text-end" style="min-width:6rem">${money(i.price * i.qty)}</div>
                <button class="btn btn-sm btn-link text-danger" data-remove="${i.id}" aria-label="${i.name} ürününü kaldır">Kaldır</button>
              </li>`)}
          </ul>
          <button class="btn btn-link text-danger px-0 mt-2" data-clear>Sepeti temizle</button>
        </div>

        <div class="col-lg-4">
          <div class="card"><div class="card-body">
            <h2 class="h5">Sipariş özeti</h2>
            <dl class="row mb-0">
              <dt class="col-6 fw-normal">Ara toplam</dt><dd class="col-6 text-end">${money(totals.subtotal)}</dd>
              <dt class="col-6 fw-normal">Kargo</dt><dd class="col-6 text-end">${totals.shipping ? money(totals.shipping) : 'Ücretsiz'}</dd>
              <dt class="col-6 border-top pt-2">Toplam</dt><dd class="col-6 text-end border-top pt-2 fw-bold fs-5">${money(totals.total)}</dd>
            </dl>
            <p class="small text-body-secondary mt-2">KDV dahildir. ${money(this.ctx.config.shop.freeShippingThreshold)} üzeri kargo ücretsiz.</p>
            <a class="btn btn-primary w-100" href="${this.href('/shop/checkout')}">Ödemeye geç</a>
          </div></div>
        </div>
      </div>`;
  }
}
