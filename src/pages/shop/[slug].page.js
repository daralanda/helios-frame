import { Component } from '../../core/component.js';
import { html, formatMoney } from '../../core/dom.js';
import { addItem } from '../../store/cart.js';
import { stars } from '../../components/product-card.js';

export default class ProductDetailPage extends Component {
  static layout = 'shop';
  static meta = { title: 'Ürün Detayı' };

  state = { loading: true, error: null, product: null };

  beforeMount() {
    this.on('click', '[data-add]', () => {
      const qty = Math.max(1, Math.min(99, Number(this.$('[name=qty]').value) || 1));
      addItem(this.ctx.store, this.state.product, qty);
      this.ctx.toast.success(`${this.state.product.name} sepete eklendi`);
    });
  }

  async afterMount() {
    try {
      const product = await this.ctx.services.products.bySlug(this.props.params.slug, { signal: this.signal });
      document.title = `${product.name} · ${this.ctx.config.appName}`;
      this.setState({ product, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.setState({ error: err.status === 404 ? 'Ürün bulunamadı.' : err.message, loading: false });
    }
  }

  render() {
    const { loading, error, product: p } = this.state;
    const back = html`<a class="btn btn-link px-0" href="${this.href('/shop')}">← Ürünlere dön</a>`;

    if (loading) return html`${back}<div class="hf-skeleton" style="height:320px"></div>`;
    if (error) return html`${back}<div class="alert alert-warning">${error}</div>`;

    const { currency } = this.ctx.config.shop;
    return html`
      ${back}
      <div class="row g-4">
        <div class="col-md-5"><div class="hf-product-thumb hf-product-thumb-lg">${p.emoji}</div></div>
        <div class="col-md-7">
          <span class="badge text-bg-light mb-2">${p.category}</span>
          <h1 class="h3">${p.name}</h1>
          <div class="text-warning mb-3">${stars(p.rating)} <span class="text-body-secondary small">${p.rating} / 5</span></div>
          <p class="text-body-secondary">${p.description}</p>
          <div class="d-flex align-items-baseline gap-2 mb-3">
            <strong class="fs-3">${formatMoney(p.price, currency)}</strong>
            ${p.oldPrice ? html`<del class="text-body-secondary">${formatMoney(p.oldPrice, currency)}</del>` : ''}
          </div>
          <p class="small ${p.stock > 0 ? 'text-success' : 'text-danger'}">${p.stock > 0 ? `Stokta (${p.stock} adet)` : 'Tükendi'}</p>
          <div class="d-flex gap-2" style="max-width:20rem">
            <input class="form-control" name="qty" type="number" min="1" max="99" value="1" aria-label="Adet" style="max-width:6rem">
            <button class="btn btn-primary flex-grow-1" data-add ${p.stock <= 0 ? 'disabled' : ''}>Sepete ekle</button>
          </div>
        </div>
      </div>`;
  }
}
