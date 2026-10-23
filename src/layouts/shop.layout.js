import { Layout } from '../core/layout.js';
import { html } from '../core/dom.js';
import { ShopHeader } from '../components/shop-header.js';

/** E-ticaret kabuğu: kalıcı header (sepet rozeti canlı) + sayfa alanı + footer. */
export default class ShopLayout extends Layout {
  render() {
    const { brand } = this.ctx.config;
    return html`
      <div data-slot="header"></div>
      <main data-outlet class="hf-outlet container py-4"></main>
      <footer class="hf-footer"><div class="container py-3 small text-body-secondary">© ${new Date().getFullYear()} ${brand} · Demo mağaza</div></footer>`;
  }

  afterRender() {
    this.mountChild(ShopHeader, '[data-slot=header]');
  }
}
