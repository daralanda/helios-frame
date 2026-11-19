/**
 * Helios Frame · E-ticaret bileşenleri.
 *
 *   <hd-cart-button></hd-cart-button>            sepet ikonu + adet rozeti, tıklayınca çekmece
 *   <hd-qty><input type="number" value="1" min="1" max="99"></hd-qty>   adet seçici
 *   <button data-cart-add data-id="SKU1" data-name="Ürün" data-price="1499.9"
 *           data-image="assets/img/p1.svg" data-url="demo/shop/urun.html" data-qty-from="#adet">
 *
 * GÜVENLİK: Sepetteki fiyatlar yalnızca gösterim içindir. Sipariş oluşturulurken ürün
 * fiyatı, stok ve indirimler SUNUCUDA ürün id'sinden yeniden hesaplanmalıdır.
 */
import { html, render, fragment, on, announce } from '../core/dom.js';
import { url } from '../core/config.js';
import { app, icon, define, HdElement } from './base.js';
import { toast } from './overlay.js';
import { productCardTpl } from './templates.js';

const clampQty = (n, max = 999) => Math.min(max, Math.max(1, Math.trunc(Number(n)) || 1));

/** Saf hesaplama (test edilebilir). */
export function cartTotals(cart = []) {
  return cart.reduce((acc, it) => ({
    count: acc.count + it.qty,
    subtotal: Math.round((acc.subtotal + it.price * it.qty) * 100) / 100,
  }), { count: 0, subtotal: 0 });
}

export function addToCart(item, qty = 1) {
  const price = Number(item.price);
  if (!item.id || !Number.isFinite(price) || price < 0) throw new Error('Geçersiz ürün');
  const { store, t } = app();
  const cart = store.get('cart') ?? [];
  const found = cart.find((c) => c.id === String(item.id));
  const next = found
    ? cart.map((c) => (c === found ? { ...c, qty: clampQty(c.qty + qty) } : c))
    : [...cart, { id: String(item.id), name: String(item.name ?? ''), price, image: item.image ?? null, url: item.url ?? null, qty: clampQty(qty) }];
  store.set('cart', next);
  toast(t('cart.added', { name: item.name }), { type: 'success', timeout: 2500 });
}

export function setQty(id, qty) {
  const { store } = app();
  store.update('cart', (cart) => cart.map((c) => (c.id === id ? { ...c, qty: clampQty(qty) } : c)));
}

export function removeFromCart(id) {
  app().store.update('cart', (cart) => cart.filter((c) => c.id !== id));
}

/* ---------------- Sepet çekmecesi ---------------- */
let drawer = null;
function cartDrawer() {
  if (drawer) return drawer;
  const a = app();
  drawer = fragment(html`<dialog class="hf-dialog hf-dialog--drawer" aria-labelledby="hf-cart-title">
    <div class="hf-dialog__head">
      <h2 class="hf-dialog__title" id="hf-cart-title">${a.t('cart.title')}</h2>
      <button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" data-dialog-close aria-label="${a.t('dialog.close')}">${icon('x')}</button>
    </div>
    <div class="hf-dialog__body" data-hf-cart-body></div>
    <div class="hf-dialog__foot" data-hf-cart-foot></div>
  </dialog>`);
  document.body.append(drawer);
  on(drawer, 'click', '[data-cart-remove]', (e, b) => removeFromCart(b.dataset.cartRemove));
  on(drawer, 'click', '[data-cart-step]', (e, b) => {
    const it = a.store.get('cart').find((c) => c.id === b.dataset.id);
    if (it) {
      const n = it.qty + Number(b.dataset.cartStep);
      if (n < 1) removeFromCart(it.id); else setQty(it.id, n);
    }
  });
  const paint = () => {
    const cart = a.store.get('cart') ?? [];
    const { count, subtotal } = cartTotals(cart);
    render(drawer.querySelector('[data-hf-cart-body]'), cart.length ? html`<ul class="hf-stack" role="list">
      ${cart.map((it) => html`<li class="hf-cluster hf-gap-2">
        <img src="${url(it.image || 'assets/img/placeholder.svg')}" alt="" width="64" height="64" class="hf-cart-thumb" loading="lazy">
        <div class="hf-grow">
          <div class="hf-bold hf-text-sm">${it.url ? html`<a href="${url(it.url)}">${it.name}</a>` : it.name}</div>
          <div class="hf-text-sm hf-muted">${a.fmt.money(it.price)}</div>
          <div class="hf-cluster hf-gap-2 hf-mt-2">
            <div class="hf-qty">
              <button type="button" data-cart-step="-1" data-id="${it.id}" aria-label="${a.t('qty.dec')}">${icon('minus', 'hf-icon--sm')}</button>
              <input type="number" value="${it.qty}" readonly aria-label="Adet" tabindex="-1">
              <button type="button" data-cart-step="1" data-id="${it.id}" aria-label="${a.t('qty.inc')}">${icon('plus', 'hf-icon--sm')}</button>
            </div>
            <button type="button" class="hf-btn hf-btn--ghost hf-btn--sm" data-cart-remove="${it.id}">${icon('trash', 'hf-icon--sm')}${a.t('cart.remove')}</button>
          </div>
        </div>
        <div class="hf-bold hf-num">${a.fmt.money(it.price * it.qty)}</div>
      </li>`)}</ul>`
      : html`<div class="hf-empty">${icon('cart')}<p>${a.t('cart.empty')}</p></div>`);
    render(drawer.querySelector('[data-hf-cart-foot]'), cart.length ? html`
      <div class="hf-w-full hf-stack hf-gap-2">
        <div class="hf-cluster hf-between"><span class="hf-muted">${a.t('cart.total')} · ${a.t('cart.items', { n: count })}</span>
          <strong class="hf-text-lg hf-num">${a.fmt.money(subtotal)}</strong></div>
        <a class="hf-btn hf-btn--primary hf-btn--lg hf-btn--block" href="${url(a.config.shop?.checkoutUrl || '#')}">${a.t('cart.checkout')}</a>
      </div>` : html``);
  };
  a.store.subscribe(paint, ['cart']);
  paint();
  return drawer;
}

export const openCart = () => cartDrawer().showModal();

class HdCartButton extends HdElement {
  connectedCallback() {
    const a = app();
    const paint = () => {
      const { count } = cartTotals(a.store.get('cart'));
      render(this, html`<button type="button" class="hf-btn hf-btn--ghost hf-btn--icon hf-cart-btn" aria-label="${a.t('cart.title')}: ${a.t('cart.items', { n: count })}">
        ${icon('cart')}${count ? html`<span class="hf-cart-btn__count">${count > 99 ? '99+' : count}</span>` : ''}</button>`);
    };
    paint();
    this._off = a.store.subscribe(paint, ['cart']);
    this.addEventListener('click', openCart);
  }
  disconnectedCallback() { this._off?.(); this.removeEventListener('click', openCart); }
}
define('hd-cart-button', HdCartButton);

class HdQty extends HdElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    const input = this.querySelector('input');
    if (!input) return;
    const t = app().t;
    this.classList.add('hf-qty');
    const mk = (step, name, label) => {
      const b = fragment(html`<button type="button" aria-label="${label}">${icon(name, 'hf-icon--sm')}</button>`);
      b.addEventListener('click', () => {
        const min = Number(input.min) || 1; const max = Number(input.max) || 999;
        input.value = String(Math.min(max, Math.max(min, (Number(input.value) || min) + step)));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return b;
    };
    input.before(mk(-1, 'minus', t('qty.dec')));
    input.after(mk(1, 'plus', t('qty.inc')));
  }
}
define('hd-qty', HdQty);

/** JS ile ürün listesi çizmek için kart şablonu (prerender edilen statik HTML ile birebir aynı). */
export function productCard(p, opts) {
  const a = app();
  return productCardTpl({ fmt: a.fmt, url, t: a.t }, p, opts);
}

let wired = false;
export function wireCommerce() {
  if (wired) return;
  wired = true;
  on(document, 'click', '[data-cart-add]', (e, b) => {
    const d = b.dataset;
    const qtyEl = d.qtyFrom ? document.querySelector(d.qtyFrom) : null;
    try {
      addToCart({ id: d.id, name: d.name, price: d.price, image: d.image, url: d.url || null }, qtyEl ? Number(qtyEl.value) : 1);
      announce(app().t('cart.added', { name: d.name }));
    } catch (err) { console.error(err); }
  });
}
