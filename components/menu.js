/**
 * <hd-menu name="panel" variant="vertical|horizontal">
 *
 * Menü içeriği tek yerden, config/menu.json içinden gelir. Aynı menü hem kenar (dikey)
 * hem üst (yatay) menü olarak çizilebilir. Rol bazlı filtreleme, rozet, ikon, alt menü,
 * mega menü ve aktif sayfa işareti otomatiktir. Bağlantılar gerçek <a href> olduğu için
 * arama motorları tarafından takip edilebilir.
 *
 * menu.json öğe şeması:
 *   { "label": "Müşteriler" | { "tr": "...", "en": "..." },
 *     "href": "panel/#/musteriler", "icon": "users", "badge": 3,
 *     "roles": ["admin"], "desc": "Kısa açıklama (mega menü)", "mega": true,
 *     "children": [ ...öğeler ] }
 * Gruplar: { "group": "Satış", "items": [ ...öğeler ] }
 */
import { html, render, nextId, on } from '../core/dom.js';
import { url } from '../core/config.js';
import { hasRole } from '../core/app.js';
import { app, icon, define, HdElement } from './base.js';

/** Menüyü gruplara normalleştirir ve role göre süzer (saf fonksiyon). */
export function normalizeMenu(entries = [], user = null) {
  const groups = [];
  let loose = null;
  const filter = (items) => items
    .filter((it) => it && hasRole(user, it.roles))
    .map((it) => (it.children ? { ...it, children: filter(it.children) } : it))
    .filter((it) => !it.children || it.children.length > 0 || it.href);
  for (const e of entries) {
    if (e.items) {
      if (!hasRole(user, e.roles)) continue;
      const items = filter(e.items);
      if (items.length) groups.push({ title: e.group, items });
      loose = null;
    } else {
      if (!loose) { loose = { title: null, items: [] }; groups.push(loose); }
      loose.items.push(e);
    }
  }
  for (const g of groups) if (g.title === null) g.items = filter(g.items);
  return groups.filter((g) => g.items.length);
}

const normPath = (p) => p.replace(/\/index\.html?$/i, '/').replace(/\/+$/, '/') || '/';

/** Çözülmüş bir bağlantının (url() sonrası) geçerli adrese uyumunu puanlar (0 = uymuyor). */
export function matchScore(href, loc = location) {
  if (!href) return 0;
  const u = new URL(href, loc.href);
  if (u.origin !== loc.origin) return 0;
  const here = normPath(loc.pathname);
  const there = normPath(u.pathname);
  const hashHere = loc.hash || '#/';
  const hashThere = u.hash;
  if (hashThere.startsWith('#/')) {
    if (here !== there) return 0;
    const a = hashHere.split('?')[0].replace(/\/+$/, '') || '#';
    const b = hashThere.replace(/\/+$/, '') || '#';
    if (a === b) return 10000;
    return b !== '#' && a.startsWith(`${b}/`) ? 1000 + b.length : 0;
  }
  if (here === there) return 5000;
  return there !== '/' && here.startsWith(there) ? there.length : 0;
}

/** Aktif öğeye giden yol: [{label, href}, ...] */
export function activeTrail(groups, loc = location) {
  let best = { score: 0, trail: [] };
  const walk = (items, trail) => {
    for (const it of items) {
      const t = [...trail, it];
      const s = it.href ? matchScore(url(it.href), loc) : 0;
      if (s > best.score) best = { score: s, trail: t };
      if (it.children) walk(it.children, t);
    }
  };
  for (const g of groups) walk(g.items, []);
  return best.trail;
}

class HdMenu extends HdElement {
  connectedCallback() {
    if (this._ready) return;
    this._ready = true;
    this.update();
    this._offs = [
      on(this, 'click', '[data-hf-toggle]', (e, btn) => this.toggle(btn)),
      () => window.removeEventListener('hashchange', this._sync),
      () => window.removeEventListener('popstate', this._sync),
      () => document.removeEventListener('click', this._outside),
      () => document.removeEventListener('keydown', this._esc),
    ];
    this._sync = () => this.markActive();
    this._outside = (e) => { if (this.variant === 'horizontal' && !this.contains(e.target)) this.closeAll(); };
    this._esc = (e) => {
      if (e.key !== 'Escape' || this.variant !== 'horizontal') return;
      const open = this.querySelector('[data-open] > [data-hf-toggle]');
      if (open) { this.closeAll(); open.focus(); }
    };
    window.addEventListener('hashchange', this._sync);
    window.addEventListener('popstate', this._sync);
    document.addEventListener('click', this._outside);
    document.addEventListener('keydown', this._esc);
    this._offs.push(app().store.subscribe(() => this.update(), ['user']));
  }

  disconnectedCallback() { this._offs?.forEach((off) => off()); this._ready = false; }

  get variant() { return this.getAttribute('variant') === 'horizontal' ? 'horizontal' : 'vertical'; }

  get groups() {
    const a = app();
    const menus = a.config.menu?.menus ?? {};
    return normalizeMenu(menus[this.getAttribute('name') || 'main'] ?? [], a.user);
  }

  update() {
    const a = app();
    const groups = this.groups;
    this._groups = groups;
    const label = this.getAttribute('aria-label') || a.t('nav.main');
    const item = (it, depth) => {
      const text = a.label(it.label);
      const badge = it.badge != null && it.badge !== '' ? html`<span class="hf-nav__badge">${it.badge}</span>` : '';
      const ico = it.icon && depth === 0 ? icon(it.icon) : '';
      const desc = it.desc && this.variant === 'horizontal' ? html`<span class="hf-nav__desc">${a.label(it.desc)}</span>` : '';
      if (it.children?.length) {
        const id = nextId('hf-sub');
        return html`<li class="hf-nav__item" ${it.mega ? html`data-mega` : ''}>
          <button type="button" class="hf-nav__link" aria-expanded="false" aria-controls="${id}" data-hf-toggle title="${text}">
            ${ico}<span class="hf-nav__label">${text}</span>${badge}${icon('chevron-down', 'hf-nav__caret')}
          </button>
          <ul class="hf-nav__sub" id="${id}" role="list">${it.children.map((c) => item(c, depth + 1))}</ul>
        </li>`;
      }
      const ext = it.external ? html` target="_blank" rel="noopener noreferrer"` : '';
      return html`<li class="hf-nav__item"><a class="hf-nav__link" href="${url(it.href || '#')}"${ext} title="${text}">
        ${ico}<span class="hf-nav__label">${text}${desc}</span>${badge}</a></li>`;
    };
    render(this, html`<nav class="hf-nav hf-nav--${this.variant}" aria-label="${label}">
      ${groups.map((g) => html`<div class="hf-nav__group">
        ${g.title ? html`<p class="hf-nav__group-title">${a.label(g.title)}</p>` : ''}
        <ul class="hf-nav__list" role="list">${g.items.map((it) => item(it, 0))}</ul>
      </div>`)}
    </nav>`);
    this.markActive();
  }

  /** Geçerli adrese göre aria-current ve açık alt menüleri ayarlar. */
  markActive() {
    const links = [...this.querySelectorAll('a.hf-nav__link')];
    let best = null; let bestScore = 0;
    for (const a of links) {
      a.removeAttribute('aria-current');
      const s = matchScore(a.getAttribute('href'));
      if (s > bestScore) { best = a; bestScore = s; }
    }
    this.querySelectorAll('[data-active]').forEach((el) => el.removeAttribute('data-active'));
    if (this.variant === 'horizontal') this.closeAll();
    if (!best) return;
    best.setAttribute('aria-current', 'page');
    let li = best.closest('.hf-nav__sub')?.closest('.hf-nav__item');
    while (li) {
      li.setAttribute('data-active', '');
      if (this.variant === 'vertical') this.setOpen(li, true);
      li = li.parentElement?.closest('.hf-nav__item');
    }
    this.dispatchEvent(new CustomEvent('hf:active', { bubbles: true, detail: { href: best.href } }));
  }

  setOpen(li, open) {
    li.toggleAttribute('data-open', open);
    li.querySelector(':scope > [data-hf-toggle]')?.setAttribute('aria-expanded', String(open));
  }

  closeAll(except = null) {
    for (const li of this.querySelectorAll('.hf-nav__item[data-open]')) if (li !== except && !li.contains(except)) this.setOpen(li, false);
  }

  toggle(btn) {
    const li = btn.closest('.hf-nav__item');
    // Daraltılmış kenar menüde alt menüye tıklanınca menüyü genişlet
    const shell = this.closest('.hf-app');
    if (shell?.hasAttribute('data-collapsed') && matchMedia('(min-width: 1024px)').matches) {
      shell.closest('hd-shell')?.setCollapsed(false);
    }
    const open = !li.hasAttribute('data-open');
    if (this.variant === 'horizontal') this.closeAll(li);
    this.setOpen(li, open);
  }
}

define('hd-menu', HdMenu);

/**
 * <hd-breadcrumb current="Ürün adı"></hd-breadcrumb>
 * Konum menüden otomatik hesaplanır. Statik (SEO) sayfalarda breadcrumb'ı doğrudan
 * HTML olarak yazın; bu bileşen panel gibi dinamik alanlar içindir.
 */
class HdBreadcrumb extends HdElement {
  connectedCallback() {
    this.update = this.update.bind(this);
    window.addEventListener('hashchange', this.update);
    window.addEventListener('popstate', this.update);
    this.update();
  }
  disconnectedCallback() {
    window.removeEventListener('hashchange', this.update);
    window.removeEventListener('popstate', this.update);
  }
  update() {
    const a = app();
    const groups = normalizeMenu(a.config.menu?.menus?.[this.getAttribute('menu') || 'main'] ?? [], a.user);
    const trail = activeTrail(groups).map((it) => ({ name: a.label(it.label), href: it.href ? url(it.href) : null }));
    const current = this.getAttribute('current');
    if (current) trail.push({ name: current, href: null });
    const items = [{ name: this.getAttribute('home-label') || a.label(a.config.brand.name), href: url(a.config.brand.home) }, ...trail];
    render(this, html`<nav class="hf-breadcrumb" aria-label="${a.t('nav.breadcrumb')}"><ol>
      ${items.map((it, i) => (i === items.length - 1
        ? html`<li><span aria-current="page">${it.name}</span></li>`
        : html`<li>${it.href ? html`<a href="${it.href}">${it.name}</a>` : it.name}</li>`))}
    </ol></nav>`);
  }
}

define('hd-breadcrumb', HdBreadcrumb);
