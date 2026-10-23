/**
 * Kimlik doğrulama servisi.
 *
 * Gerçek API sözleşmesi (mock: false):
 *   POST /auth/login  { email, password } -> { token, user: { name, email, company } }
 * Token store.user.token içinde tutulur ve HttpClient interceptor'ı ile Authorization başlığına eklenir.
 *
 * MOCK MODU: parola "demo" olan her e-posta kabul edilir. Güvenlik amaçlı DEĞİLDİR.
 */
import { sleep } from '../core/dom.js';
import { config } from '../config.js';

export class AuthService {
  constructor({ http, mock, store }) {
    this.http = http;
    this.mock = mock;
    this.store = store;
  }

  async login(email, password) {
    let session;
    if (this.mock) {
      await sleep(config.api.mockDelay * 2);
      if (password !== 'demo') throw new Error('E-posta veya parola hatalı (demo parolası: demo)');
      session = {
        token: `mock.${Date.now()}`,
        user: { name: email.split('@')[0], email, company: 'Demo Firma A.Ş.' },
      };
    } else {
      session = await this.http.post('/auth/login', { email, password });
    }
    this.store.set({ user: { ...session.user, token: session.token } });
    return this.store.state.user;
  }

  logout() {
    this.store.set({ user: null });
  }
}
