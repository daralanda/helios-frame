/**
 * <hd-table src="data/musteriler.json" page-size="10" searchable
 *           columns='[{"key":"name","label":"Firma"},{"key":"balance","label":"Bakiye","type":"money"}]'>
 * </hd-table>
 *
 * JS ile:  table.columns = [...]; table.data = rows;
 * Sütun:   { key, label, type: text|number|money|date|relative|badge|link,
 *            sortable (varsayılan true), align: 'end', href: 'musteri.html?id={id}',
 *            badges: { "Aktif": "success" }, render: (row) => html`...` }
 * Olay:    'hd-row' -> e.detail.row  (satıra tıklanınca / Enter)
 *
 * Arama Türkçe büyük/küçük harf duyarsızdır (İ/ı). Dar alanda tablo kart listesine döner.
 */
import { html, render, on, debounce, $ } from '../core/dom.js';
import { url } from '../core/config.js';
import { app, icon, define, jsonAttr, HdElement } from './base.js';

const collator = new Intl.Collator('tr', { numeric: true, sensitivity: 'base' });
const fold = (v) => String(v ?? '').toLocaleLowerCase('tr-TR');

/** Saf veri işlemleri (test edilebilir). */
export function query(rows, { search = '', sortKey = null, sortDir = 'asc', columns = [] } = {}) {
  let out = rows;
  const q = fold(search.trim());
  if (q) {
    const keys = columns.length ? columns.map((c) => c.key) : Object.keys(rows[0] ?? {});
    out = out.filter((r) => keys.some((k) => fold(r[k]).includes(q)));
  }
  if (sortKey) {
    const col = columns.find((c) => c.key === sortKey);
    const numeric = col && ['number', 'money'].includes(col.type);
    const dated = col && ['date', 'relative'].includes(col.type);
    const dir = sortDir === 'desc' ? -1 : 1;
    out = [...out].sort((a, b) => {
      const x = a[sortKey]; const y = b[sortKey];
      if (numeric) return (Number(x) - Number(y)) * dir;
      if (dated) return (new Date(x) - new Date(y)) * dir;
      return collator.compare(String(x ?? ''), String(y ?? '')) * dir;
    });
  }
  return out;
}

class HdTable extends HdElement {
  constructor() {
    super();
    this._rows = [];
    this._columns = null;
    this.state = { search: '', sortKey: null, sortDir: 'asc', page: 1, size: 10 };
  }

  set data(rows) { this._rows = Array.isArray(rows) ? rows : []; this.state.page = 1; if (this._ready) this.refresh(); }
  get data() { return this._rows; }
  set columns(cols) { this._columns = cols; if (this._ready) this.build(); }
  get columns() {
    return this._columns ?? jsonAttr(this, 'columns') ?? Object.keys(this._rows[0] ?? {}).map((k) => ({ key: k, label: k }));
  }

  async connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.state.size = Number(this.getAttribute('page-size')) || 10;
    this.build();
    const src = this.getAttribute('src');
    if (src && !this._rows.length) {
      this.setAttribute('aria-busy', 'true');
      try {
        const res = await app().data.get(src, { cache: 30000 });
        this._rows = Array.isArray(res) ? res : res.items ?? [];
      } catch (err) {
        console.error('[hd-table]', err);
      } finally {
        this.removeAttribute('aria-busy');
      }
      this.refresh();
    }
  }

  build() {
    const a = app();
    const searchable = this.hasAttribute('searchable');
    render(this, html`
      ${searchable || this.querySelector('[slot="toolbar"]') ? html`<div class="hf-table-toolbar">
        ${searchable ? html`<div class="hf-input-group">${icon('search')}
          <input class="hf-input" type="search" data-hf-search placeholder="${a.t('table.search')}" aria-label="${a.t('table.search')}"></div>` : ''}
        <div class="hf-cluster" data-hf-tools></div>
      </div>` : ''}
      <div class="hf-table-wrap"><table class="hf-table">
        ${this.getAttribute('caption') ? html`<caption class="hf-sr-only">${this.getAttribute('caption')}</caption>` : ''}
        <thead><tr>${this.columns.map((c) => html`<th scope="col" class="${['number', 'money'].includes(c.type) || c.align === 'end' ? 'hf-num' : ''}"
          ${c.sortable !== false ? html`aria-sort="none" data-key="${c.key}"` : ''}>
          ${c.sortable !== false ? html`<button type="button" class="hf-table__sort">${c.label ?? c.key}${icon('arrow-up')}</button>` : (c.label ?? c.key)}
        </th>`)}</tr></thead>
        <tbody></tbody>
      </table></div>
      <div class="hf-table-foot" data-hf-foot></div>`);
    this.bindOnce();
    this.refresh();
  }

  bindOnce() {
    if (this._bound) return;
    this._bound = true;
    on(this, 'input', '[data-hf-search]', debounce((e) => { this.state.search = e.target.value; this.state.page = 1; this.refresh(); }, 180));
    on(this, 'click', 'th[data-key] .hf-table__sort', (e, btn) => {
      const key = btn.closest('th').dataset.key;
      const s = this.state;
      s.sortDir = s.sortKey === key && s.sortDir === 'asc' ? 'desc' : 'asc';
      s.sortKey = key;
      this.refresh();
    });
    on(this, 'click', '[data-page]', (e, btn) => { this.state.page = Number(btn.dataset.page); this.refresh(); this.querySelector('table').scrollIntoView({ block: 'nearest' }); });
    on(this, 'change', '[data-hf-size]', (e) => { this.state.size = Number(e.target.value); this.state.page = 1; this.refresh(); });
    const emit = (tr) => {
      const row = this._view?.[Number(tr.dataset.i)];
      if (row) this.dispatchEvent(new CustomEvent('hd-row', { bubbles: true, detail: { row } }));
    };
    on(this, 'click', 'tbody tr[data-i]', (e, tr) => { if (!e.target.closest('a, button, input')) emit(tr); });
    on(this, 'keydown', 'tbody tr[data-i]', (e, tr) => { if (e.key === 'Enter' && e.target === tr) emit(tr); });
  }

  cell(col, row) {
    const a = app();
    const v = row[col.key];
    if (col.render) return col.render(row, a);
    switch (col.type) {
      case 'money': return a.fmt.money(v);
      case 'number': return a.fmt.number(v);
      case 'date': return a.fmt.date(v);
      case 'relative': return html`<time datetime="${v}" title="${a.fmt.datetime(v)}">${a.fmt.relative(v)}</time>`;
      case 'badge': return html`<span class="hf-badge hf-badge--dot hf-badge--${col.badges?.[v] ?? 'primary'}">${v}</span>`;
      case 'link': return html`<a href="${url(String(col.href ?? '#').replace(/\{(\w+)\}/g, (_, k) => encodeURIComponent(row[k] ?? '')))}">${v}</a>`;
      default: return v ?? '';
    }
  }

  refresh() {
    if (!this._ready || !this.querySelector('tbody')) return;
    const a = app();
    const cols = this.columns;
    const s = this.state;
    const all = query(this._rows, { ...s, columns: cols });
    const pages = Math.max(1, Math.ceil(all.length / s.size));
    s.page = Math.min(Math.max(1, s.page), pages);
    const start = (s.page - 1) * s.size;
    this._view = all.slice(start, start + s.size);
    const clickable = this.hasAttribute('clickable');

    for (const th of this.querySelectorAll('th[data-key]')) {
      th.setAttribute('aria-sort', th.dataset.key === s.sortKey ? (s.sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
    }
    render(this.querySelector('tbody'), this._view.length
      ? html`${this._view.map((row, i) => html`<tr data-i="${i}" ${clickable ? html`tabindex="0"` : ''}>
          ${cols.map((c) => html`<td data-label="${c.label ?? c.key}" class="${['number', 'money'].includes(c.type) || c.align === 'end' ? 'hf-num' : ''}">${this.cell(c, row)}</td>`)}
        </tr>`)}`
      : html`<tr><td class="hf-table-empty" colspan="${cols.length}">${this.hasAttribute('aria-busy') ? '…' : a.t('table.empty')}</td></tr>`);

    // Sayfalama: ilk, son, aktifin çevresi
    const nums = [...new Set([1, s.page - 1, s.page, s.page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((x, y) => x - y);
    const btns = [];
    nums.forEach((n, i) => {
      if (i && n - nums[i - 1] > 1) btns.push(html`<li aria-hidden="true">…</li>`);
      btns.push(html`<li><button type="button" data-page="${n}" ${n === s.page ? html`aria-current="page"` : ''}>${n}</button></li>`);
    });
    render($('[data-hf-foot]', this), html`
      <span>${all.length ? a.t('table.range', { from: start + 1, to: Math.min(start + s.size, all.length), total: all.length }) : ''}</span>
      <div class="hf-cluster">
        <label class="hf-cluster hf-gap-2 hf-text-sm hf-hide-sm">${a.t('table.perPage')}
          <select class="hf-select hf-w-auto" data-hf-size>${[10, 25, 50, 100].map((n) => html`<option value="${n}" ${n === s.size ? html`selected` : ''}>${n}</option>`)}</select>
        </label>
        <nav aria-label="Sayfalama"><ul class="hf-pagination">
          <li><button type="button" data-page="${s.page - 1}" aria-label="${a.t('table.prev')}" ${s.page === 1 ? html`disabled` : ''}>${icon('chevron-left', 'hf-icon--sm')}</button></li>
          ${btns}
          <li><button type="button" data-page="${s.page + 1}" aria-label="${a.t('table.next')}" ${s.page === pages ? html`disabled` : ''}>${icon('chevron-right', 'hf-icon--sm')}</button></li>
        </ul></nav>
      </div>`);
  }
}

define('hd-table', HdTable);
