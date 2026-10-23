import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

export default class HomePage extends Component {
  static layout = 'default';
  static meta = { title: 'Ana Sayfa' };

  render() {
    const { brand, version } = this.ctx.config;
    return html`
      <section class="py-4 py-md-5 text-center">
        <span class="badge text-bg-light mb-3">v${version} · Vanilla JS · Sıfır bağımlılık</span>
        <h1 class="display-5 fw-bold">${brand} <span class="text-primary">Frame</span></h1>
        <p class="lead text-body-secondary mx-auto" style="max-width:40rem">
          Derleme adımı ve Node.js gerektirmeyen, paylaşımlı hosting'de çalışan hafif bir ön yüz çatısı.
          ES modülleri, istemci tarafı router, bileşen yaşam döngüsü ve localStorage destekli durum yönetimi.
        </p>
      </section>

      <section class="row g-4 mb-5">
        <div class="col-md-6">
          <div class="card h-100"><div class="card-body">
            <h2 class="h4">🛍️ E-Ticaret modülü</h2>
            <p class="text-body-secondary">Ürün listeleme, arama/filtreleme/sıralama, sepet ve çok adımlı ödeme akışı.</p>
            <a class="btn btn-primary" href="${this.href('/shop')}">Mağazayı aç</a>
          </div></div>
        </div>
        <div class="col-md-6">
          <div class="card h-100"><div class="card-body">
            <h2 class="h4">🏢 B2B panel modülü</h2>
            <p class="text-body-secondary">Müşteri paneli, DataTables tablosu, Chart.js grafikleri ve kurumsal teklif formu.</p>
            <a class="btn btn-primary" href="${this.href('/b2b')}">Panele git</a>
            <span class="small text-body-secondary ms-2">demo parola: <code>demo</code></span>
          </div></div>
        </div>
      </section>

      <section class="row g-3 text-center">
        ${[
          ['🧩', 'Bileşen tabanlı', 'Class tabanlı Component, tam yaşam döngüsü ve otomatik temizlik.'],
          ['🧭', 'Hash / History router', 'Tembel yüklenen sayfalar, guard\'lar, layout\'lar.'],
          ['📦', 'Esnek kütüphane yükleyici', 'Bootstrap, DataTables, Chart.js: CDN veya yerel, çakışmasız.'],
          ['💾', 'Durum + API katmanı', 'localStorage destekli store, interceptor\'lu REST istemcisi.'],
        ].map(([icon, title, text]) => html`
          <div class="col-6 col-lg-3"><div class="p-3 h-100 border rounded-3">
            <div class="fs-2">${icon}</div><h3 class="h6 mt-2">${title}</h3><p class="small text-body-secondary mb-0">${text}</p>
          </div></div>`)}
      </section>`;
  }
}
