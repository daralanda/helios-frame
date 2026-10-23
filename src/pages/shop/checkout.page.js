import { Component } from '../../core/component.js';
import { html, formatMoney } from '../../core/dom.js';
import { validate, minLength } from '../../core/forms.js';
import { formField } from '../../ui/form-field.js';
import { cartTotals, clearCart } from '../../store/cart.js';

const STEPS = ['Teslimat', 'Kargo & Ödeme', 'Onay'];

const SHIPPING = {
  standard: 'Standart kargo (2-4 iş günü)',
  express: 'Hızlı kargo (ertesi iş günü)',
};
const PAYMENT = {
  cod: 'Kapıda ödeme',
  transfer: 'Havale / EFT',
  card: 'Kredi / banka kartı (ödeme sağlayıcısı entegrasyonu gerekir)',
};

const SCHEMA = {
  name: ['required', minLength(3)],
  email: ['required', 'email'],
  phone: ['required', 'phone'],
  city: ['required'],
  address: ['required', minLength(10)],
};

/** Üç adımlı ödeme akışı. Form değerleri `this.values` içinde tutulur: adımlar arası kaybolmaz, yazarken yeniden çizim olmaz. */
export default class CheckoutPage extends Component {
  state = { step: 1, errors: {}, busy: false };
  values = { name: '', email: '', phone: '', city: '', address: '', shipping: 'standard', payment: 'cod' };

  beforeMount() {
    if (!this.ctx.store.state.cart.items.length) {
      this.ctx.router.navigate('/shop/cart', { replace: true });
      return;
    }
    const user = this.ctx.store.state.user;
    if (user) Object.assign(this.values, { name: user.name ?? '', email: user.email ?? '' });

    this.on('input', '[name]', (e, el) => { this.values[el.name] = el.value; });
    this.on('change', '[type=radio]', (e, el) => { this.values[el.name] = el.value; this.update(); });
    this.on('click', '[data-next]', () => this.next());
    this.on('click', '[data-prev]', () => this.setState({ step: this.state.step - 1, errors: {} }));
    this.on('click', '[data-place]', () => this.placeOrder());
  }

  next() {
    const { step } = this.state;
    if (step === 1) {
      const errors = validate(this.values, SCHEMA);
      if (Object.keys(errors).length) return this.setState({ errors });
    }
    this.setState({ step: step + 1, errors: {} });
  }

  get totals() {
    const base = cartTotals(this.ctx.store.state);
    const shipping = this.values.shipping === 'express' ? this.ctx.config.shop.expressFee : base.shipping;
    return { ...base, shipping, total: base.subtotal + shipping };
  }

  async placeOrder() {
    if (this.state.busy) return;
    this.setState({ busy: true });
    try {
      const { name, email, phone, city, address, shipping, payment } = this.values;
      const order = await this.ctx.services.orders.create({
        customer: { name, email, phone, city, address },
        shipping,
        payment,
        items: this.ctx.store.state.cart.items,
        totals: this.totals,
      });
      clearCart(this.ctx.store);
      this.ctx.router.navigate(`/shop/order/${order.id}`);
    } catch (err) {
      this.ctx.toast.error(`Sipariş oluşturulamadı: ${err.message}`);
      this.setState({ busy: false });
    }
  }

  render() {
    const { step, errors, busy } = this.state;
    const v = this.values;
    const money = (n) => formatMoney(n, this.ctx.config.shop.currency);
    const totals = this.totals;

    const stepper = html`
      <ol class="hf-steps mb-4" aria-label="Adımlar">
        ${STEPS.map((label, i) => html`
          <li class="${i + 1 === step ? 'is-current' : ''} ${i + 1 < step ? 'is-done' : ''}" ${i + 1 === step ? 'aria-current="step"' : ''}>
            <span>${i + 1}</span> ${label}
          </li>`)}
      </ol>`;

    let body;
    if (step === 1) {
      body = html`
        <div class="row g-3">
          ${formField({ name: 'name', label: 'Ad soyad', value: v.name, error: errors.name, col: 'col-md-6', attrs: 'autocomplete="name"' })}
          ${formField({ name: 'email', label: 'E-posta', type: 'email', value: v.email, error: errors.email, col: 'col-md-6', attrs: 'autocomplete="email"' })}
          ${formField({ name: 'phone', label: 'Telefon', type: 'tel', value: v.phone, error: errors.phone, col: 'col-md-6', attrs: 'autocomplete="tel"' })}
          ${formField({ name: 'city', label: 'Şehir', value: v.city, error: errors.city, col: 'col-md-6' })}
          ${formField({ name: 'address', label: 'Açık adres', type: 'textarea', value: v.address, error: errors.address })}
        </div>`;
    } else if (step === 2) {
      body = html`
        <h2 class="h6">Teslimat yöntemi</h2>
        ${Object.entries(SHIPPING).map(([key, label]) => html`
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="shipping" id="ship-${key}" value="${key}" ${v.shipping === key ? 'checked' : ''}>
            <label class="form-check-label" for="ship-${key}">${label}
              <span class="text-body-secondary">— ${key === 'express' ? money(this.ctx.config.shop.expressFee) : (cartTotals(this.ctx.store.state).shipping ? money(cartTotals(this.ctx.store.state).shipping) : 'Ücretsiz')}</span>
            </label>
          </div>`)}
        <h2 class="h6 mt-4">Ödeme yöntemi</h2>
        ${Object.entries(PAYMENT).map(([key, label]) => html`
          <div class="form-check mb-2">
            <input class="form-check-input" type="radio" name="payment" id="pay-${key}" value="${key}" ${v.payment === key ? 'checked' : ''}>
            <label class="form-check-label" for="pay-${key}">${label}</label>
          </div>`)}`;
    } else {
      body = html`
        <div class="row g-4">
          <div class="col-md-6">
            <h2 class="h6">Teslimat</h2>
            <p class="mb-1">${v.name}</p>
            <p class="mb-1 small text-body-secondary">${v.email} · ${v.phone}</p>
            <p class="small text-body-secondary">${v.address}, ${v.city}</p>
            <p class="small mb-0">${SHIPPING[v.shipping]}<br>${PAYMENT[v.payment]}</p>
          </div>
          <div class="col-md-6">
            <h2 class="h6">Ürünler</h2>
            <ul class="list-unstyled small mb-0">
              ${this.ctx.store.state.cart.items.map((i) => html`<li class="d-flex justify-content-between"><span>${i.qty} × ${i.name}</span><span>${money(i.price * i.qty)}</span></li>`)}
            </ul>
          </div>
        </div>`;
    }

    return html`
      <h1 class="h3 mb-3">Ödeme</h1>
      ${stepper}
      <div class="row g-4">
        <div class="col-lg-8">
          <div class="card"><div class="card-body">${body}</div></div>
          <div class="d-flex justify-content-between mt-3">
            ${step > 1 ? html`<button class="btn btn-outline-secondary" data-prev ${busy ? 'disabled' : ''}>Geri</button>` : html`<a class="btn btn-outline-secondary" href="${this.href('/shop/cart')}">Sepete dön</a>`}
            ${step < 3
              ? html`<button class="btn btn-primary" data-next>Devam et</button>`
              : html`<button class="btn btn-primary" data-place ${busy ? 'disabled' : ''}>${busy ? 'Sipariş veriliyor…' : 'Siparişi onayla'}</button>`}
          </div>
        </div>
        <div class="col-lg-4">
          <div class="card"><div class="card-body">
            <h2 class="h6">Özet</h2>
            <dl class="row mb-0 small">
              <dt class="col-6 fw-normal">Ara toplam</dt><dd class="col-6 text-end">${money(totals.subtotal)}</dd>
              <dt class="col-6 fw-normal">Kargo</dt><dd class="col-6 text-end">${totals.shipping ? money(totals.shipping) : 'Ücretsiz'}</dd>
              <dt class="col-6 border-top pt-2">Toplam</dt><dd class="col-6 text-end border-top pt-2 fw-bold">${money(totals.total)}</dd>
            </dl>
          </div></div>
        </div>
      </div>`;
  }
}
