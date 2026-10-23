import { Component } from '../core/component.js';
import { html, formatMoney } from '../core/dom.js';
import { addItem, qtyInCart } from '../store/cart.js';

export const stars = (rating) => {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

/** props: { product } */
export class ProductCard extends Component {
  beforeMount() {
    const { id } = this.props.product;
    this.watch(this.ctx.store, (s) => qtyInCart(s, id), () => this.update());

    this.on('click', '[data-add]', () => {
      const p = this.props.product;
      addItem(this.ctx.store, p);
      this.ctx.toast.success(`${p.name} sepete eklendi`);
    });
  }

  render() {
    const p = this.props.product;
    const inCart = qtyInCart(this.ctx.store.state, p.id);
    const { currency } = this.ctx.config.shop;
    return html`
      <article class="card h-100 hf-product">
        <a class="hf-product-thumb text-decoration-none" href="${this.href(`/shop/${p.slug}`)}" aria-label="${p.name}">${p.emoji}</a>
        <div class="card-body d-flex flex-column">
          <span class="badge text-bg-light align-self-start mb-2">${p.category}</span>
          <h2 class="h6 card-title"><a class="text-reset text-decoration-none" href="${this.href(`/shop/${p.slug}`)}">${p.name}</a></h2>
          <div class="text-warning small mb-2" aria-label="Puan ${p.rating}">${stars(p.rating)} <span class="text-body-secondary">${p.rating}</span></div>
          <div class="mt-auto">
            <div class="d-flex align-items-baseline gap-2 mb-2">
              <strong class="fs-5">${formatMoney(p.price, currency)}</strong>
              ${p.oldPrice ? html`<del class="small text-body-secondary">${formatMoney(p.oldPrice, currency)}</del>` : ''}
            </div>
            <button class="btn btn-primary w-100" data-add ${p.stock <= 0 ? 'disabled' : ''}>
              ${p.stock <= 0 ? 'Tükendi' : inCart ? `Sepette (${inCart}) · Ekle` : 'Sepete ekle'}
            </button>
          </div>
        </div>
      </article>`;
  }
}
