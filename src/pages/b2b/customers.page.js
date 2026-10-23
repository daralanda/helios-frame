import { Component } from '../../core/component.js';
import { html, escapeHtml, formatMoney, formatDate } from '../../core/dom.js';
import { DataTableView } from '../../components/data-table-view.js';

const STATUS_CLASS = { Aktif: 'success', Pasif: 'secondary', Potansiyel: 'warning' };

const COLUMNS = [
  { title: 'Firma', data: 'company', render: (d, t) => (t === 'display' ? `<strong>${escapeHtml(d)}</strong>` : d) },
  { title: 'Yetkili', data: 'contact' },
  { title: 'Şehir', data: 'city' },
  { title: 'Sektör', data: 'sector' },
  { title: 'Bakiye', data: 'balance', className: 'text-end', render: (d, t) => (t === 'display' ? formatMoney(d) : d) },
  { title: 'Son sipariş', data: 'lastOrder', render: (d, t) => (t === 'display' ? formatDate(d) : d) },
  {
    title: 'Durum',
    data: 'status',
    render: (d, t) => (t === 'display' ? `<span class="badge text-bg-${STATUS_CLASS[d] ?? 'secondary'}">${escapeHtml(d)}</span>` : d),
  },
  {
    title: '',
    data: 'id',
    orderable: false,
    searchable: false,
    className: 'text-end',
    render: (id) => `<button class="btn btn-sm btn-outline-primary" data-quote="${escapeHtml(id)}">Teklif hazırla</button>`,
  },
];

export default class CustomersPage extends Component {
  static libs = ['datatables'];
  state = { loading: true, error: null, rows: [], status: '' };

  beforeMount() {
    this.on('change', '[name=status]', (e, el) => this.setState({ status: el.value }));
    this.on('click', '[data-quote]', (e, el) => this.ctx.router.navigate(`/b2b/quotes/new?customer=${encodeURIComponent(el.dataset.quote)}`));
  }

  async afterMount() {
    try {
      const rows = await this.ctx.services.customers.list({ signal: this.signal });
      this.setState({ rows, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.setState({ error: err.message, loading: false });
    }
  }

  render() {
    const { loading, error, status } = this.state;
    return html`
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 class="h3 mb-0">Müşteriler</h1>
        <select class="form-select w-auto" name="status" aria-label="Duruma göre filtrele">
          <option value="">Tüm durumlar</option>
          ${['Aktif', 'Pasif', 'Potansiyel'].map((s) => html`<option value="${s}" ${s === status ? 'selected' : ''}>${s}</option>`)}
        </select>
      </div>
      <div class="card"><div class="card-body">
        ${error ? html`<div class="alert alert-danger mb-0">${error}</div>`
          : loading ? html`<div class="hf-skeleton" style="height:260px"></div>`
          : html`<div data-slot="table"></div>`}
      </div></div>`;
  }

  afterRender() {
    const { loading, error, rows, status } = this.state;
    if (loading || error) return;
    this.mountChild(DataTableView, '[data-slot=table]', {
      columns: COLUMNS,
      data: status ? rows.filter((r) => r.status === status) : rows,
      options: { order: [[0, 'asc']] },
    });
  }
}
