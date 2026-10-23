import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

export default class NotFoundPage extends Component {
  static layout = 'default';
  static meta = { title: 'Sayfa Bulunamadı' };

  render() {
    return html`
      <div class="text-center py-5">
        <div class="display-1">🌑</div>
        <h1 class="h3 mt-3">Sayfa bulunamadı</h1>
        <p class="text-body-secondary">Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.</p>
        <a class="btn btn-primary" href="${this.href('/')}">Ana sayfaya dön</a>
      </div>`;
  }
}
