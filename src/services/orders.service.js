/**
 * Sipariş servisi.
 *
 * Gerçek API sözleşmesi (mock: false):
 *   POST /orders      { customer, shipping, payment, items, totals } -> { id, ...order }
 *   GET  /orders/:id  -> Order
 *
 * Kart ile ödeme: ödeme sağlayıcısı (iyzico, PayTR vb.) yönlendirmesi/token alma adımı
 * create() çağrısından ÖNCE burada yapılmalıdır. Kart verisi asla bu istemcide işlenmez/saklanmaz.
 */
import { localDb } from './mock.js';
import { sleep } from '../core/dom.js';
import { config } from '../config.js';

export class OrderService {
  constructor({ http, mock }) {
    this.http = http;
    this.mock = mock;
    this.db = localDb('orders');
  }

  async create(payload) {
    if (!this.mock) return this.http.post('/orders', payload);
    await sleep(config.api.mockDelay * 3);
    const id = `HF-${Date.now().toString(36).toUpperCase()}`;
    return this.db.insert({ id, status: 'Alındı', createdAt: new Date().toISOString(), ...payload });
  }

  async get(id, { signal } = {}) {
    if (!this.mock) return this.http.get(`/orders/${encodeURIComponent(id)}`, { signal });
    await sleep(config.api.mockDelay);
    const order = this.db.all().find((o) => o.id === id);
    if (!order) throw Object.assign(new Error('Sipariş bulunamadı'), { status: 404 });
    return order;
  }
}
