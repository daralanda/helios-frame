import { Component } from '../core/component.js';
import { html, raw } from '../core/dom.js';

/**
 * Kütüphanesiz veri tablosu: arama, sütuna göre sıralama, sayfalama.
 *
 * props:
 *   rows:      nesne dizisi
 *   columns:   [{ key, title, class?, sortable?=true, searchable?=true,
 *                 value?: (row) => sıralama/arama değeri,
 *                 render?: (row) => html`` | metin }]   // metin otomatik escape edilir
 *   pageSize?: 10
 *   emptyText?: string
 *
 * Satır düğmeleri için render içinde data-* öznitelikli düğme üretin ve ebeveynde
 * this.on('click', '[data-xyz]', ...) ile dinleyin (tablo yeniden çizilse de çalışır).
 */
export class DataTable extends Component {
  state = { q: '', sortKey: null, sortDir: 'asc', page: 1 };

  beforeMount() {
    this.state = { ...this.state, ...(this.props.initial ?? {}) };

    this.on('input', '[name=q]', (e, el) => this.setState({ q: el.value, page: 1 }));
    this.on('click', '[data-sort]', (e, el) => {
      const key = el.dataset.sort;
      const { sortKey, sortDir } = this.state;
      this.setState({ sortKey: key, sortDir: sortKey === key && sortDir === 'asc' ? 'desc' : 'asc', page: 1 });
    });
    this.on('click', '[data-page]', (e, el) => this.setState({ page: Number(el.dataset.page) }));
  }

  #valueOf(col, row) {
    return col.value ? col.value(row) : row[col.key];
  }

  #visibleRows() {
    const { rows, columns } = this.props;
    const { q, sortKey, sortDir } = this.state;
    let out = rows;

    const needle = q.trim().toLocaleLowerCase('tr');
    if (needle) {
      const searchCols = columns.filter((c) => c.searchable !== false);
      out = out.filter((row) =>
        searchCols.some((c) => String(this.#valueOf(c, row) ?? '').toLocaleLowerCase('tr').includes(needle)));
    }

    const col = columns.find((c) => c.key === sortKey);
    if (col) {
      const dir = sortDir === 'asc' ? 1 : -1;
      out = [...out].sort((a, b) => {
        const x = this.#valueOf(col, a);
        const y = this.#valueOf(col, b);
        if (x == null && y == null) return 0;
        if (x == null) return 1;           // boş değerler hep sonda
        if (y == null) return -1;
        if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
        return String(x).localeCompare(String(y), 'tr', { numeric: true }) * dir;
      });
    }
    return out;
  }

  render() {
    const { columns, pageSize = 10, emptyText = 'Gösterilecek kayıt yok' } = this.props;
    const { q, sortKey, sortDir } = this.state;

    const all = this.#visibleRows();
    const pages = Math.max(1, Math.ceil(all.length / pageSize));
    const page = Math.min(this.state.page, pages);
    const rows = all.slice((page - 1) * pageSize, page * pageSize);

    return html`
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
        <input class="form-control" style="max-width:18rem" name="q" type="search" value="${q}" placeholder="Tabloda ara…" aria-label="Tabloda ara">
        <span class="small text-body-secondary" aria-live="polite">${all.length} kayıt</span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-2">
          <thead>
            <tr>
              ${columns.map((c) => {
                const active = c.key === sortKey;
                const aria = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
                return html`
                  <th scope="col" class="${c.class ?? ''}" ${c.sortable === false ? '' : raw(`aria-sort="${aria}"`)}>
                    ${c.sortable === false
                      ? c.title
                      : html`<button type="button" class="hf-th-btn" data-sort="${c.key}">${c.title}<span aria-hidden="true">${active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}</span></button>`}
                  </th>`;
              })}
            </tr>
          </thead>
          <tbody>
            ${rows.length
              ? rows.map((row) => html`<tr>${columns.map((c) => html`<td class="${c.class ?? ''}">${c.render ? c.render(row) : this.#valueOf(c, row)}</td>`)}</tr>`)
              : html`<tr><td colspan="${columns.length}" class="text-center text-body-secondary py-4">${emptyText}</td></tr>`}
          </tbody>
        </table>
      </div>
      ${pages > 1 ? html`
        <nav class="d-flex justify-content-between align-items-center" aria-label="Tablo sayfalama">
          <span class="small text-body-secondary">Sayfa ${page} / ${pages}</span>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Önceki</button>
            <button class="btn btn-outline-secondary" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Sonraki</button>
          </div>
        </nav>` : ''}`;
  }
}
