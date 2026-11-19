/**
 * <hd-shell nav="vertical|horizontal|both" menu="panel" top-menu="main" width="normal" search cart>
 *   ...sayfa içeriği (HTML olarak kalır, SEO için)...
 *   <a slot="actions" ...>  -> üst çubuğun sağına taşınır
 * </hd-shell>
 *
 * Uygulama çerçevesini (kenar menü, üst çubuk, mobil çekmece, alt bilgi) config'den kurar.
 * Öznitelik verilmezse değerler project.config.json -> layout bölümünden alınır.
 */
import { html, render, on, $ } from '../core/dom.js';
import { url } from '../core/config.js';
import { toggleMode, resolveWidth } from '../core/theme.js';
import { app, icon, define, HdElement } from './base.js';

const COLLAPSE_KEY = 'hf-nav-collapsed';

class HdShell extends HdElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    const a = app();
    const L = a.config.layout;
    const nav = this.getAttribute('nav') || document.documentElement.dataset.nav || L.nav;
    const menu = this.getAttribute('menu') || 'main';
    const topMenu = this.getAttribute('top-menu') || menu;
    const search = this.hasAttribute('search') || L.search;
    const brand = a.config.brand;
    const brandName = a.label(brand.name);

    // Mevcut içeriği koru
    const content = [...this.childNodes];
    const actions = content.filter((n) => n.nodeType === 1 && n.getAttribute('slot') === 'actions');

    const brandMark = (cls) => html`<a class="${cls}" href="${url(brand.home)}">
      <img src="${url(brand.logo)}" alt="" width="32" height="32"><span>${brandName}</span></a>`;

    render(this, html`
      <a class="hf-skip-link" href="#hf-main">İçeriğe geç</a>
      <div class="hf-app" data-nav="${nav}">
        <aside class="hf-sidebar" id="hf-sidebar" aria-label="${a.t('nav.main')}">
          ${brandMark('hf-sidebar__brand')}
          <div class="hf-sidebar__body"><hd-menu name="${menu}" variant="vertical"></hd-menu></div>
          ${L.collapsible && nav !== 'horizontal' ? html`<div class="hf-sidebar__foot">
            <button type="button" class="hf-nav__link hf-collapse-toggle" data-hf-collapse aria-pressed="false" title="${a.t('nav.collapse')}">
              ${icon('sidebar')}<span class="hf-nav__label">${a.t('nav.collapse')}</span>
            </button></div>` : ''}
        </aside>
        <div class="hf-backdrop" data-hf-drawer-close></div>
        <header class="hf-topbar">
          <button type="button" class="hf-btn hf-btn--ghost hf-btn--icon hf-menu-toggle" data-hf-drawer
            aria-controls="hf-sidebar" aria-expanded="false" aria-label="${a.t('nav.toggle')}">${icon('menu')}</button>
          ${brandMark('hf-topbar__brand')}
          ${nav === 'vertical' ? html`<div class="hf-topbar__nav"><hd-breadcrumb menu="${menu}"></hd-breadcrumb></div>` : ''}
          ${nav !== 'vertical' ? html`<div class="hf-topbar__nav"><hd-menu name="${topMenu}" variant="horizontal"></hd-menu></div>` : ''}
          ${search ? html`<form class="hf-topbar__search" role="search" action="${url(L.searchUrl || '#')}">
            <div class="hf-input-group">${icon('search')}
              <input class="hf-input" type="search" name="q" placeholder="${a.t('search.placeholder')}" aria-label="${a.t('search.placeholder')}" autocomplete="off">
            </div></form>` : ''}
          <div class="hf-topbar__actions" data-hf-actions>
            ${L.themeToggle ? html`<button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" data-hf-theme aria-label="${a.t('theme.toggle')}">
              <span class="hf-theme-icon-dark">${icon('moon')}</span><span class="hf-theme-icon-light">${icon('sun')}</span></button>` : ''}
            ${this.hasAttribute('cart') ? html`<hd-cart-button></hd-cart-button>` : ''}
            ${a.user ? this.userMenu(a) : ''}
          </div>
        </header>
        <main class="hf-main" id="hf-main" tabindex="-1"><div class="hf-page"></div></main>
        ${L.footer ? this.footer(a) : ''}
      </div>`);

    $('.hf-page', this).append(...content.filter((n) => !actions.includes(n)));
    const slot = $('[data-hf-actions]', this);
    for (const el of actions) { el.removeAttribute('slot'); slot.prepend(el); }

    this.app = $('.hf-app', this);
    // Sayfaya özel genişlik (yalnızca bu sayfa; kullanıcı tercihini değiştirmez)
    const pageWidth = resolveWidth(this.getAttribute('width'));
    if (pageWidth) this.app.style.setProperty('--hf-container', pageWidth);
    this.toggleBtn = $('[data-hf-drawer]', this);
    try { if (localStorage.getItem(COLLAPSE_KEY) === '1') this.setCollapsed(true, false); } catch { /* yok say */ }

    this._offs = [
      on(this, 'click', '[data-hf-drawer]', () => this.setDrawer(!this.app.hasAttribute('data-drawer-open'))),
      on(this, 'click', '[data-hf-drawer-close]', () => this.setDrawer(false)),
      on(this, 'click', '[data-hf-collapse]', () => this.setCollapsed(!this.app.hasAttribute('data-collapsed'))),
      on(this, 'click', '[data-hf-theme]', () => toggleMode()),
      // Mobilde bir bağlantıya tıklanınca çekmeceyi kapat
      on(this, 'click', '.hf-sidebar a[href]', () => this.setDrawer(false)),
    ];
    this._key = (e) => { if (e.key === 'Escape' && this.app.hasAttribute('data-drawer-open')) { this.setDrawer(false); this.toggleBtn.focus(); } };
    document.addEventListener('keydown', this._key);
    this._mq = matchMedia('(min-width: 1024px)');
    this._mqFn = () => { if (this._mq.matches) this.setDrawer(false); };
    this._mq.addEventListener('change', this._mqFn);
  }

  disconnectedCallback() {
    this._offs?.forEach((off) => off());
    document.removeEventListener('keydown', this._key);
    this._mq?.removeEventListener('change', this._mqFn);
  }

  setDrawer(open) {
    this.app.toggleAttribute('data-drawer-open', open);
    this.toggleBtn?.setAttribute('aria-expanded', String(open));
    const mobile = !matchMedia('(min-width: 1024px)').matches;
    for (const el of this.app.querySelectorAll(':scope > .hf-main, :scope > .hf-topbar, :scope > .hf-footer')) {
      el.inert = open && mobile;
    }
    document.body.style.overflow = open && mobile ? 'hidden' : '';
    if (open) requestAnimationFrame(() => this.querySelector('.hf-sidebar a, .hf-sidebar button')?.focus());
  }

  setCollapsed(collapsed, persist = true) {
    this.app.toggleAttribute('data-collapsed', collapsed);
    this.querySelector('[data-hf-collapse]')?.setAttribute('aria-pressed', String(collapsed));
    if (persist) try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch { /* yok say */ }
  }

  userMenu(a) {
    const u = a.user;
    const initials = String(u.name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR');
    return html`<button type="button" class="hf-btn hf-btn--ghost hf-btn--icon" popovertarget="hf-user-menu" aria-label="${u.name}">
        <span class="hf-avatar">${initials}</span></button>
      <div class="hf-popover" id="hf-user-menu" popover>
        <div class="hf-menu-item hf-bold">${u.name}</div>
        ${u.email ? html`<div class="hf-menu-item hf-muted hf-text-xs">${u.email}</div>` : ''}
        <div class="hf-menu-sep"></div>
        ${(a.config.auth.userLinks ?? []).map((l) => html`<a class="hf-menu-item" href="${url(l.href)}">${l.icon ? icon(l.icon) : ''}${a.label(l.label)}</a>`)}
        ${a.config.auth.logoutUrl ? html`<a class="hf-menu-item" href="${url(a.config.auth.logoutUrl)}">${icon('logout')}Çıkış yap</a>` : ''}
      </div>`;
  }

  footer(a) {
    const f = a.config.footer ?? {};
    const year = new Date().getFullYear();
    return html`<footer class="hf-footer"><div class="hf-container hf-footer__grid">
      <span>© ${year} ${a.label(f.copyright ?? a.config.brand.name)}</span>
      ${f.links?.length ? html`<ul>${f.links.map((l) => html`<li><a href="${url(l.href)}">${a.label(l.label)}</a></li>`)}</ul>` : ''}
    </div></footer>`;
  }
}

define('hd-shell', HdShell);
