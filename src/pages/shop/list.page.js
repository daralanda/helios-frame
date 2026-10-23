import { Component } from '../../core/component.js';
import { html, debounce } from '../../core/dom.js';
import { ProductCard } from '../../components/product-card.js';

const SORTS = [
  ['featured', 'Önerilen'],
  ['price-asc', 'Fiyat (artan)'],
  ['price-desc', 'Fiyat (azalan)'],
  ['rating', 'En yüksek puan'],
  ['name', 'İsim (A-Z)'],
];
const PER_PAGE = 8;

/**
 * Ürün listeleme: arama (debounce), kategori, sıralama, sayfalama.
 * Filtreler URL'e yazılır (router.setQuery) -> paylaşılabilir, F5 ve geri tuşu dostu.
 */
export default class ShopListPage extends Component {
  state = { loading: true, error: null, items: [], total: 0, categories: [], q: '', category: '', sort: 'featured', page: 1 };
  #request = 0;

  beforeMount() {
    const { q = '', category = '', sort = 'featured', page = '1' } = this.props.query;
    this.state = { ...this.state, q, category, sort, page: Number(page) || 1 };

    const search = debounce((q) => this.applyFilters({ q, page: 1 }), 300);
    this.addCleanup(() => search.cancel());

    this.on('input', '[name=q]', (e, el) => search(el.value));
    this.on('change', '[name=category]', (e, el) => this.applyFilters({ category: el.value, page: 1 }));
    this.on('change', '[name=sort]', (e, el) => this.applyFilters({ sort: el.value, page: 1 }));
    this.on('click', '[data-page]', (e, el) => {
      e.preventDefault();
      this.applyFilters({ page: Number(el.dataset.page) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    this.on('click', '[data-reset]', () => this.applyFilters({ q: '', category: '', sort: 'featured', page: 1 }));
  }

  async afterMount() {
    this.ctx.services.products.categories({ signal: this.signal })
      .then((categories) => this.setState({ categories }))
      .catch(() => {});
    await this.load();
  }

  applyFilters(patch) {
    this.setState(patch);
    const { q, category, sort, page } = this.state;
    this.ctx.router.setQuery({ q, category, sort: sort === 'featured' ? '' : sort, page: page > 1 ? page : '' });
    return this.load();
  }

  async load() {
    const id = ++this.#request; // eski yanıtlar yeni filtrelerin üzerine yazmasın
    const { q, category, sort, page } = this.state;
    this.setState({ loading: true, error: null });
    try {
      const res = await this.ctx.services.products.list({ q, category, sort, page, perPage: PER_PAGE, signal: this.signal });
      if (id === this.#request) this.setState({ items: res.items, total: res.total, loading: false });
    } catch (err) {
      if (err.name === 'AbortError' || id !== this.#request) return;
      this.setState({ error: err.message, loading: false });
    }
  }

  render() {
    const { loading, error, items, total, categories, q, category, sort, page } = this.state;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));

    return html`
      <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-3">
        <div>
          <h1 class="h3 mb-0">Ürünler</h1>
          <p class="text-body-secondary mb-0" aria-live="polite">${loading && !items.length ? 'Yükleniyor…' : `${total} ürün`}</p>
        </div>
      </div>

      <div class="row g-2 mb-4" role="search">
        <div class="col-12 col-md-6">
          <input class="form-control" id="q" name="q" type="search" value="${q}" placeholder="Ürün ara…" aria-label="Ürün ara">
        </div>
        <div class="col-6 col-md-3">
          <select class="form-select" name="category" aria-label="Kategori">
            <option value="">Tüm kategoriler</option>
            ${categories.map((c) => html`<option value="${c}" ${c === category ? 'selected' : ''}>${c}</option>`)}
          </select>
        </div>
        <div class="col-6 col-md-3">
          <select class="form-select" name="sort" aria-label="Sıralama">
            ${SORTS.map(([v, label]) => html`<option value="${v}" ${v === sort ? 'selected' : ''}>${label}</option>`)}
          </select>
        </div>
      </div>

      ${error ? html`<div class="alert alert-danger">${error}</div>` : ''}

      <div class="row g-3 ${loading && items.length ? 'opacity-50' : ''}" aria-busy="${loading}">
        ${loading && !items.length
          ? Array.from({ length: PER_PAGE }, () => html`<div class="col-6 col-md-4 col-xl-3"><div class="hf-skeleton"></div></div>`)
          : items.map((p) => html`<div class="col-6 col-md-4 col-xl-3" data-product="${p.id}"></div>`)}
      </div>

      ${!loading && !items.length && !error ? html`
        <div class="text-center py-5 text-body-secondary">
          Sonuç bulunamadı. <button class="btn btn-link p-0 align-baseline" data-reset>Filtreleri temizle</button>
        </div>` : ''}

      ${pages > 1 ? html`
        <nav class="mt-4" aria-label="Sayfalama">
          <ul class="pagination justify-content-center flex-wrap">
            ${Array.from({ length: pages }, (_, i) => i + 1).map((n) => html`
              <li class="page-item ${n === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${n}">${n}</a></li>`)}
          </ul>
        </nav>` : ''}`;
  }

  afterRender() {
    const byId = new Map(this.state.items.map((p) => [String(p.id), p]));
    this.$$('[data-product]').forEach((slot) => {
      this.mountChild(ProductCard, slot, { product: byId.get(slot.dataset.product) });
    });
  }
}
