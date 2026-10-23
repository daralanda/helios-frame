/**
 * Servis katmanı: tek bir HttpClient örneği + alan servisleri.
 * Bileşenlerde: this.ctx.services.products.list(...)
 */
import { HttpClient } from '../core/http.js';
import { AuthService } from './auth.service.js';
import { ProductService } from './products.service.js';
import { OrderService } from './orders.service.js';
import { CustomerService, QuoteService, ReportService } from './b2b.service.js';

export function createServices(ctx) {
  const { config, store } = ctx;

  const http = new HttpClient({ baseURL: config.api.baseURL, timeout: config.api.timeout });

  // Her isteğe oturum token'ını ekle.
  http.useRequest(({ url, init }) => {
    const token = store.state.user?.token;
    if (token) init.headers.Authorization = `Bearer ${token}`;
    return { url, init };
  });

  // 401 -> oturumu kapat ve giriş sayfasına gönder.
  http.useError((err) => {
    if (err.status === 401 && store.state.user) {
      store.set({ user: null });
      ctx.toast?.error('Oturum süresi doldu, lütfen tekrar giriş yapın.');
      ctx.router?.navigate('/login');
    }
  });

  const deps = { http, mock: config.api.mock, store };

  return {
    http,
    auth: new AuthService(deps),
    products: new ProductService(deps),
    orders: new OrderService(deps),
    customers: new CustomerService(deps),
    quotes: new QuoteService(deps),
    reports: new ReportService(deps),
  };
}
