import { Component } from '../core/component.js';
import { html } from '../core/dom.js';
import { cartCount } from '../store/cart.js';

/** Alt bileşen örneği: kendi başına store'u (sepet) ve rotayı (aktif bağlantı) dinler. JS kütüphanesi kullanmaz. */
export class ShopHeader extends Component {
  beforeMount() {
    this.state = { count: cartCount(this.ctx.store.state), path: this.ctx.router.current?.path ?? '/shop', open: false };
    this.watch(this.ctx.store, (s) => cartCount(s), (count) => this.setState({ count }));
    this.onBus('route:change', (to) => this.setState({ path: to.path, open: false }));
    this.on('click', '[data-toggle]', () => this.setState({ open: !this.state.open }));
  }

  render() {
    const { count, path, open } = this.state;
    const active = (p) => (path === p ? 'active' : '');
    return html`
      <nav class="navbar navbar-expand-md hf-topbar">
        <div class="container">
          <a class="hf-brand navbar-brand" href="${this.href('/shop')}"><span class="hf-sun" aria-hidden="true"></span>${this.ctx.config.brand} Mağaza</a>
          <button class="navbar-toggler" type="button" data-toggle aria-controls="hf-shop-nav" aria-expanded="${String(open)}" aria-label="Menü">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse ${open ? 'show' : ''}" id="hf-shop-nav">
            <ul class="navbar-nav me-auto">
              <li class="nav-item"><a class="nav-link ${active('/shop')}" href="${this.href('/shop')}">Ürünler</a></li>
              <li class="nav-item"><a class="nav-link" href="${this.href('/')}">Ana Sayfa</a></li>
            </ul>
            <a class="btn btn-outline-primary position-relative ${active('/shop/cart')}" href="${this.href('/shop/cart')}">
              🛒 Sepet
              ${count ? html`<span class="badge rounded-pill bg-primary ms-1" aria-label="${count} ürün">${count}</span>` : ''}
            </a>
          </div>
        </div>
      </nav>`;
  }
}
