import { Component } from '../../../core/component.js';
import { html, formatMoney } from '../../../core/dom.js';

export default class OrderPage extends Component {
  static layout = 'shop';
  static meta = { title: 'Sipariş' };

  state = { loading: true, error: null, order: null };

  async afterMount() {
    try {
      const order = await this.ctx.services.orders.get(this.props.params.id, { signal: this.signal });
      this.setState({ order, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.setState({ error: err.message, loading: false });
    }
  }

  render() {
    const { loading, error, order } = this.state;
    if (loading) return html`<div class="hf-skeleton" style="height:200px"></div>`;
    if (error) {
      return html`<div class="alert alert-warning">${error}</div><a class="btn btn-primary" href="${this.href('/shop')}">Mağazaya dön</a>`;
    }

    const money = (n) => formatMoney(n, this.ctx.config.shop.currency);
    return html`
      <div class="text-center py-4">
        <div class="display-3">✅</div>
        <h1 class="h3 mt-2">Siparişiniz alındı</h1>
        <p class="text-body-secondary">Sipariş no: <strong>${order.id}</strong></p>
      </div>
      <div class="card mx-auto" style="max-width:36rem"><div class="card-body">
        <ul class="list-unstyled mb-3">
          ${order.items.map((i) => html`<li class="d-flex justify-content-between"><span>${i.qty} × ${i.name}</span><span>${money(i.price * i.qty)}</span></li>`)}
        </ul>
        <div class="d-flex justify-content-between border-top pt-2 fw-bold"><span>Toplam</span><span>${money(order.totals.total)}</span></div>
        <p class="small text-body-secondary mt-3 mb-0">${order.customer.name} · ${order.customer.address}, ${order.customer.city}</p>
      </div></div>
      <div class="text-center mt-4"><a class="btn btn-primary" href="${this.href('/shop')}">Alışverişe devam et</a></div>`;
  }
}
