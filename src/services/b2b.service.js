/**
 * B2B servisleri: müşteriler, teklifler, rapor.
 *
 * Gerçek API sözleşmesi (mock: false):
 *   GET  /customers            -> Customer[]
 *   GET  /customers/:id        -> Customer
 *   GET  /quotes               -> Quote[]
 *   POST /quotes               -> Quote
 *   GET  /reports/dashboard    -> { kpis, monthly, quoteStatus }
 */
import { localDb, mockData } from './mock.js';
import { sleep } from '../core/dom.js';
import { config } from '../config.js';

export class CustomerService {
  constructor({ http, mock }) {
    this.http = http;
    this.mock = mock;
  }

  list({ signal } = {}) {
    return this.mock ? mockData('customers') : this.http.get('/customers', { signal });
  }

  async byId(id, { signal } = {}) {
    if (!this.mock) return this.http.get(`/customers/${encodeURIComponent(id)}`, { signal });
    return (await mockData('customers')).find((c) => String(c.id) === String(id)) ?? null;
  }
}

export class QuoteService {
  constructor({ http, mock }) {
    this.http = http;
    this.mock = mock;
    this.db = localDb('quotes');
  }

  async list({ signal } = {}) {
    if (!this.mock) return this.http.get('/quotes', { signal });
    const seed = await mockData('quotes');
    return [...this.db.all(), ...seed];
  }

  async create(payload) {
    if (!this.mock) return this.http.post('/quotes', payload);
    await sleep(config.api.mockDelay * 3);
    const no = `TKL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    return this.db.insert({
      no,
      company: payload.company,
      createdAt: new Date().toISOString().slice(0, 10),
      validUntil: payload.validUntil,
      total: payload.totals.total,
      status: 'Beklemede',
    });
  }
}

export class ReportService {
  constructor({ http, mock }) {
    this.http = http;
    this.mock = mock;
  }

  dashboard({ signal } = {}) {
    return this.mock ? mockData('stats') : this.http.get('/reports/dashboard', { signal });
  }
}
