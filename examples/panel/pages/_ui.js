/** Panel sayfaları için ortak parçalar. */
import { html } from '../../../core/dom.js';

export function pageHead(title, desc = '', actions = '') {
  return html`<header class="hf-page__head">
    <div><h1 class="hf-page__title">${title}</h1>${desc ? html`<p class="hf-page__desc">${desc}</p>` : ''}</div>
    ${actions ? html`<div class="hf-cluster">${actions}</div>` : ''}
  </header>`;
}

export const STATUS_BADGES = {
  Aktif: 'success', Beklemede: 'warning', Pasif: 'danger',
  Hazırlanıyor: 'warning', Kargoda: 'info', 'Teslim edildi': 'success', İptal: 'danger',
  Taslak: 'primary', Gönderildi: 'info', Onaylandı: 'success', Reddedildi: 'danger',
};
