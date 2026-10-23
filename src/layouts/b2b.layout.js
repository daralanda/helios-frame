import { Layout } from '../core/layout.js';
import { html } from '../core/dom.js';
import { B2BSidebar } from '../components/b2b-sidebar.js';

/** Kurumsal panel kabuğu: sol menü + içerik alanı. */
export default class B2BLayout extends Layout {
  render() {
    return html`
      <div class="hf-b2b">
        <div data-slot="sidebar" class="hf-b2b-side"></div>
        <main data-outlet class="hf-outlet hf-b2b-main p-3 p-md-4"></main>
      </div>`;
  }

  afterRender() {
    this.mountChild(B2BSidebar, '[data-slot=sidebar]');
  }
}
