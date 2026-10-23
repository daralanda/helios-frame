import { Component } from '../../core/component.js';
import { html, formatMoney, formatDate } from '../../core/dom.js';
import { DataTable } from '../../components/data-table.js';

const STATUS_CLASS = { Beklemede: 'warning', Onaylandı: 'success', Reddedildi: 'danger' };

const COLUMNS = [
  { key: 'no', title: 'Teklif no', render: (r) => html`<code>${r.no}</code>` },
  { key: 'company', title: 'Firma' },
  { key: 'createdAt', title: 'Tarih', render: (r) => formatDate(r.createdAt) },
  { key: 'validUntil', title: 'Geçerlilik', render: (r) => formatDate(r.validUntil) },
  { key: 'total', title: 'Tutar', class: 'text-end', render: (r) => formatMoney(r.total) },
  { key: 'status', title: 'Durum', render: (r) => html`<span class="badge text-bg-${STATUS_CLASS[r.status] ?? 'secondary'}">${r.status}</span>` },
];

export default class QuotesPage extends Component {
  state = { loading: true, error: null, rows: [] };

  async afterMount() {
    try {
      const rows = await this.ctx.services.quotes.list({ signal: this.signal });
      this.setState({ rows, loading: false });
    } catch (err) {
      if (err.name === 'AbortError') return;
      this.setState({ error: err.message, loading: false });
    }
  }

  render() {
    const { loading, error } = this.state;
    return html`
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h1 class="h3 mb-0">Teklifler</h1>
        <a class="btn btn-primary" href="${this.href('/b2b/quotes/new')}">+ Yeni teklif</a>
      </div>
      <div class="card"><div class="card-body">
        ${error ? html`<div class="alert alert-danger mb-0">${error}</div>`
          : loading ? html`<div class="hf-skeleton" style="height:260px"></div>`
          : html`<div data-slot="table"></div>`}
      </div></div>`;
  }

  afterRender() {
    const { loading, error, rows } = this.state;
    if (loading || error) return;
    this.mountChild(DataTable, '[data-slot=table]', { columns: COLUMNS, rows, initial: { sortKey: 'createdAt', sortDir: 'desc' } });
  }
}
