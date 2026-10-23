import { Layout } from '../core/layout.js';
import { html } from '../core/dom.js';

/** Tanıtım/genel sayfalar için sade üst menülü layout. */
export default class DefaultLayout extends Layout {
  render() {
    const { brand } = this.ctx.config;
    return html`
      <header class="hf-topbar">
        <div class="container d-flex align-items-center justify-content-between py-3">
          <a class="hf-brand" href="${this.href('/')}"><span class="hf-sun" aria-hidden="true"></span>${brand}</a>
          <nav class="d-flex gap-2">
            <a class="btn btn-sm btn-outline-primary" href="${this.href('/shop')}">E-Ticaret Demo</a>
            <a class="btn btn-sm btn-primary" href="${this.href('/b2b')}">B2B Panel Demo</a>
          </nav>
        </div>
      </header>
      <main data-outlet class="hf-outlet container py-4"></main>
      <footer class="hf-footer"><div class="container py-3 small text-body-secondary">© ${new Date().getFullYear()} ${brand}</div></footer>`;
  }
}
