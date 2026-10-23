import { Layout } from '../core/layout.js';
import { html } from '../core/dom.js';

/** Çerçevesiz layout (giriş sayfası vb.). */
export default class BlankLayout extends Layout {
  render() {
    return html`<main data-outlet class="hf-outlet"></main>`;
  }
}
