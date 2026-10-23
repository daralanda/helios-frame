/**
 * Ürün servisi.
 *
 * Gerçek API sözleşmesi (mock: false):
 *   GET /products?q=&category=&sort=&page=&perPage=  -> { items: Product[], total: number }
 *   GET /products/categories                          -> string[]
 *   GET /products/:slug                               -> Product
 */
import { mockData } from './mock.js';

const SORTERS = {
  featured: null,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.name.localeCompare(b.name, 'tr'),
};

export class ProductService {
  constructor({ http, mock }) {
    this.http = http;
    this.mock = mock;
  }

  async list({ q = '', category = '', sort = 'featured', page = 1, perPage = 8, signal } = {}) {
    if (!this.mock) return this.http.get('/products', { params: { q, category, sort, page, perPage }, signal });

    let items = await mockData('products');
    const needle = q.trim().toLocaleLowerCase('tr');
    if (needle) items = items.filter((p) => `${p.name} ${p.category}`.toLocaleLowerCase('tr').includes(needle));
    if (category) items = items.filter((p) => p.category === category);
    if (SORTERS[sort]) items = [...items].sort(SORTERS[sort]);

    const total = items.length;
    return { items: items.slice((page - 1) * perPage, page * perPage), total };
  }

  async categories({ signal } = {}) {
    if (!this.mock) return this.http.get('/products/categories', { signal });
    const items = await mockData('products');
    return [...new Set(items.map((p) => p.category))].sort((a, b) => a.localeCompare(b, 'tr'));
  }

  async bySlug(slug, { signal } = {}) {
    if (!this.mock) return this.http.get(`/products/${encodeURIComponent(slug)}`, { signal });
    const product = (await mockData('products')).find((p) => p.slug === slug);
    if (!product) throw Object.assign(new Error('Ürün bulunamadı'), { status: 404 });
    return product;
  }
}
