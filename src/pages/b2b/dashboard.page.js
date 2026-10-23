import { Component } from '../../core/component.js';
import { html, formatMoney } from '../../core/dom.js';
import { LineChart, DonutChart } from '../../components/charts.js';

const STATUS_COLORS = { Beklemede: '#f59f00', Onaylandı: '#2f9e44', Reddedildi: '#e03131' };

/** Grafikler harici kütüphane olmadan (saf SVG) çizilir: bkz. components/charts.js */
export default class DashboardPage extends Component {
  state = { loading: true, error: null, data: null };

  async afterMount() {
    try {
      const data = await this.ctx.services.reports.dashboard({ signal: this.signal });
      this.setState({ data, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.setState({ error: err.message, loading: false });
    }
  }

  render() {
    const { loading, error, data } = this.state;
    const user = this.ctx.store.state.user;

    const header = html`
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div><h1 class="h3 mb-0">Panel</h1><p class="text-body-secondary mb-0">Hoş geldiniz, ${user?.name}</p></div>
        <a class="btn btn-primary" href="${this.href('/b2b/quotes/new')}">+ Yeni teklif</a>
      </div>`;

    if (loading) return html`${header}<div class="hf-skeleton" style="height:240px"></div>`;
    if (error) return html`${header}<div class="alert alert-danger">${error}</div>`;

    const { kpis } = data;
    const cards = [
      ['Aylık ciro', formatMoney(kpis.revenue)],
      ['Sipariş', kpis.orders],
      ['Aktif müşteri', kpis.customers],
      ['Bekleyen teklif', kpis.openQuotes],
    ];

    return html`
      ${header}
      <div class="row g-3 mb-4">
        ${cards.map(([label, value]) => html`
          <div class="col-6 col-xl-3"><div class="card h-100"><div class="card-body">
            <div class="small text-body-secondary">${label}</div><div class="fs-3 fw-semibold">${value}</div>
          </div></div></div>`)}
      </div>
      <div class="row g-3">
        <div class="col-lg-8"><div class="card h-100"><div class="card-body">
          <h2 class="h6">Aylık ciro</h2><div data-slot="revenue"></div>
        </div></div></div>
        <div class="col-lg-4"><div class="card h-100"><div class="card-body">
          <h2 class="h6">Teklif durumları</h2><div data-slot="quotes"></div>
        </div></div></div>
      </div>`;
  }

  afterRender() {
    const { data } = this.state;
    if (!data) return;

    this.mountChild(LineChart, '[data-slot=revenue]', {
      labels: data.monthly.labels,
      values: data.monthly.revenue,
      label: 'Aylık ciro grafiği',
      format: (v) => formatMoney(v),
    });

    this.mountChild(DonutChart, '[data-slot=quotes]', {
      items: Object.entries(data.quoteStatus).map(([label, value]) => ({ label, value, color: STATUS_COLORS[label] ?? '#868e96' })),
    });
  }
}
