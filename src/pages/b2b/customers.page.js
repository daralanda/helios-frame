import { Component } from '../../core/component.js';
import { html, formatMoney, formatDate } from '../../core/dom.js';
import { DataTable } from '../../components/data-table.js';

const STATUS_CLASS = { Aktif: 'success', Pasif: 'secondary', Potansiyel: 'warning' };

const COLUMNS = [
  { key: 'company', title: 'Firma', render: (r) => html`<strong>${r.company}</strong>` },
  { key: 'contact', title: 'Yetkili' },
  { key: 'city', title: 'Şehir' },
  { key: 'sector', title: 'Sektör' },
  { key: 'balance', title: 'Bakiye', class: 'text-end', render: (r) => formatMoney(r.balance) },
  { key: 'lastOrder', title: 'Son sipariş', render: (r) => formatDate(r.lastOrder) || '—' },
  { key: 'status', title: 'Durum', render: (r) => html`<span class="badge text-bg-${STATUS_CLASS[r.status] ?? 'secondary'}">${r.status}</span>` },
  {
    key: 'actions',
    title: '',
    sortable: false,
    searchable: false,
    class: 'text-end',
    render: (r) => html`<button class="btn btn-sm btn-outline-primary" data-quote="${r.id}">Teklif hazırla</button>`,
  },
];

export default class CustomersPage extends Component {
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
    this.mountChild(DataTable, '[data-slot=table]', {
      columns: COLUMNS,
      rows: status ? rows.filter((r) => r.status === status) : rows,
      initial: { sortKey: 'company' },
    });
  }
}
