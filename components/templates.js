/**
 * Helios Frame · Ortak (izomorfik) şablonlar.
 * Hem tarayıcıda hem Node'da (tools/prerender-shop.mjs) çalışır; DOM'a bağımlı değildir.
 * Böylece sunucuda üretilen SEO uyumlu HTML ile JS ile çizilen kartlar birebir aynı olur.
 *
 * h: yardımcılar { fmt, url, t } -> url(path) projenin köküne göre yol üretir.
 */
import { html } from '../core/dom.js';

export const iconTpl = (h, name, cls = '') =>
  html`<svg class="hf-icon ${cls}" aria-hidden="true" focusable="false"><use href="${h.url('assets/icons.svg')}#i-${name}"></use></svg>`;

export function ratingTpl(p) {
  if (!p.rating) return '';
  return html`<span class="hf-rating"><span class="hf-rating__stars" data-hf-value="${p.rating}" aria-hidden="true">★★★★★</span>
    <span>${String(p.rating).replace('.', ',')} <span class="hf-sr-only">/ 5 puan,</span>(${p.reviewCount ?? 0})</span></span>`;
}

export function priceTpl(h, p) {
  return html`<span class="hf-price"><span class="hf-price__now">${h.fmt.money(p.price)}</span>${p.oldPrice
    ? html`<del class="hf-price__old"><span class="hf-sr-only">Eski fiyat: </span>${h.fmt.money(p.oldPrice)}</del>` : ''}</span>`;
}

/** Ürün kartı. opts.eager: ilk satırdaki görseller için lazy-load kapatılır (LCP). */
export function productCardTpl(h, p, { eager = false, headingLevel = 3 } = {}) {
  const href = h.url(p.url || '#');
  const title = html`<a href="${href}">${p.name}</a>`;
  return html`<article class="hf-card hf-card--interactive hf-product" data-cat="${p.cat ?? ''}" data-price="${p.price}" data-stock="${p.stock ?? 0}" data-name="${p.name}">
    <div class="hf-product__media">
      <img src="${h.url(p.image)}" alt="${p.name}" width="400" height="400" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">
      ${p.tags?.length ? html`<div class="hf-product__tags">${p.tags.map((tg) => html`<span class="hf-badge hf-badge--primary">${tg}</span>`)}</div>` : ''}
    </div>
    <div class="hf-product__body">
      ${p.brand ? html`<span class="hf-product__brand">${p.brand}</span>` : ''}
      ${headingLevel === 2 ? html`<h2 class="hf-product__title">${title}</h2>` : html`<h3 class="hf-product__title">${title}</h3>`}
      ${ratingTpl(p)}
      ${p.stock === 0 ? html`<span class="hf-badge hf-badge--danger">Tükendi</span>` : ''}
    </div>
    <div class="hf-product__foot">
      ${priceTpl(h, p)}
      <button type="button" class="hf-btn hf-btn--primary hf-btn--sm hf-btn--icon" aria-label="${h.t('cart.add')}: ${p.name}" ${p.stock === 0 ? html`disabled` : ''}
        data-cart-add data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}" data-url="${p.url ?? ''}">${iconTpl(h, 'plus')}</button>
    </div>
  </article>`;
}
