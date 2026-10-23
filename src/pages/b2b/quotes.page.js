import { Component } from '../../core/component.js';
import { html, escapeHtml, formatMoney, formatDate } from '../../core/dom.js';
import { DataTableView } from '../../components/data-table-view.js';

const STATUS_CLASS = { Beklemede: 'warning', Onaylandı: 'success', Reddedildi: 'danger' };

const COLUMNS = [
  { title: 'Teklif no', data: 'no', render: (d, t) => (t === 'display' ? `<code>${escapeHtml(d)}</code>` : d) },
  { title: 'Firma', data: 'company', render: (d, t) => (t === 'display' ? escapeHtml(d) : d) },
  { title: 'Tarih', data: 'createdAt', render: (d, t) => (t === 'display' ? formatDate(d) : d) },
  { title: 'Geçerlilik', data: 'validUntil', render: (d, t) => (t === 'display' ? formatDate(d) : d) },
  { title: 'Tutar', data: 'total', className: 'text-end', render: (d, t) => (t === 'display' ? formatMoney(d) : d) },
  {
    title: 'Durum',
    data: 'status',
    render: (d, t) => (t === 'display' ? `<span class="badge text-bg-${STATUS_CLASS[d] ?? 'secondary'}">${escapeHtml(d)}</span>` : d),
  },
];

export default class QuotesPage extends Component {
  static libs = ['datatables'];
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
    this.mountChild(DataTableView, '[data-slot=table]', { columns: COLUMNS, data: rows, options: { order: [[2, 'desc']] } });
  }
}
