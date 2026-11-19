/**
 * Demo uygulamaları için ortak parçalar: sayfa başlığı, KPI kartı, durum rozetleri,
 * hazır liste sayfası ve "demo kapsamı dışında" sayfası.
 * Gerçek projede bu dosya proje içinde yaşar; framework çekirdeğinin parçası değildir.
 */
import { html, $ } from '../../core/dom.js';
import { icon } from '../../components/base.js';

export function pageHead(title, desc = '', actions = '') {
  return html`<header class="hf-page__head">
    <div><h1 class="hf-page__title">${title}</h1>${desc ? html`<p class="hf-page__desc">${desc}</p>` : ''}</div>
    ${actions ? html`<div class="hf-cluster">${actions}</div>` : ''}
  </header>`;
}

/** Durum metni -> rozet rengi (tüm demolar için ortak sözlük) */
export const STATUS = {
  // genel
  Aktif: 'success', Pasif: 'danger', Askıda: 'warning', Beklemede: 'warning',
  // sipariş / sevk
  'Onay bekliyor': 'warning', Hazırlanıyor: 'info', 'Sevk bekliyor': 'warning', Kargoda: 'info', 'Teslim edildi': 'success', İptal: 'danger',
  // fatura / ödeme
  Gönderildi: 'info', 'Kabul edildi': 'success', Kuyrukta: 'warning', Başarılı: 'success', '3D doğrulanamadı': 'danger', 'İade edildi': 'primary',
  // teklif / lead
  Taslak: 'primary', Reddedildi: 'danger', Onaylandı: 'success',
  Yeni: 'info', 'İletişime geçildi': 'primary', Nitelikli: 'success', 'Nitelikli değil': 'danger', Dönüştürüldü: 'success',
  // İK
  İçeride: 'success', 'Geç kaldı': 'warning', İzinli: 'info', Raporlu: 'primary', Gelmedi: 'danger',
  Kapandı: 'success', 'Banka listesi gönderildi': 'info', Hesaplanıyor: 'warning',
  Çevrimiçi: 'success', Çevrimdışı: 'danger', Bakımda: 'warning',
};

export function kpiCard(k, app) {
  const value = k.format === 'money' ? app.fmt.money(k.value) : app.fmt.number(k.value);
  const up = k.trend >= 0;
  const good = k.invert ? !up : up;
  return html`<article class="hf-card hf-stat"><div class="hf-card__body">
    <div class="hf-stat__top"><span class="hf-stat__label">${k.label}</span>
      ${k.icon ? html`<span class="hf-stat__icon">${icon(k.icon)}</span>` : ''}</div>
    <div class="hf-stat__value">${value}</div>
    <div class="hf-stat__foot">
      <span class="hf-trend ${good ? 'hf-trend--up' : 'hf-trend--down'}">${up ? '▲' : '▼'} ${app.fmt.percent(Math.abs(k.trend))}</span>
      <span>${k.hint ?? 'geçen aya göre'}</span>
    </div>
  </div></article>`;
}

export const kpiSkeleton = (n = 4) => html`${Array.from({ length: n }, () => html`<div class="hf-skeleton hf-skeleton--card"></div>`)}`;

/**
 * Hazır liste sayfası (sayfa modülü döndürür).
 *   listPage({ title, desc, src: 'examples/data/crm/companies.json', columns, actions, filter: { key, label, options } })
 */
export function listPage({ title, desc = '', src, columns, pageSize = 10, actions = null, filter = null, transform = null, onRow = null }) {
  return {
    title,
    render: (app) => html`${pageHead(title, desc, typeof actions === 'function' ? actions(app) : actions)}
      ${filter ? html`<div class="hf-cluster hf-gap-2" role="group" aria-label="${filter.label}" data-filter>
        ${['Tümü', ...filter.options].map((o, i) => html`<button type="button" class="hf-btn hf-btn--sm ${i === 0 ? 'hf-btn--soft' : 'hf-btn--ghost'}" data-value="${o}" aria-pressed="${i === 0}">${o}</button>`)}
      </div>` : ''}
      <hd-table class="hf-mt-4" id="list" page-size="${pageSize}" searchable ${onRow ? html`clickable` : ''} caption="${title}"></hd-table>`,
    async mount(el, app) {
      let rows = await app.data.get(src, { cache: 60000 });
      if (transform) rows = transform(rows, app);
      const table = $('#list', el);
      if (!table) return undefined;
      table.columns = typeof columns === 'function' ? columns(app) : columns;
      table.data = rows;
      const offs = [];
      const bar = $('[data-filter]', el);
      if (bar) {
        const fn = (e) => {
          const btn = e.target.closest('[data-value]');
          if (!btn) return;
          for (const b of bar.querySelectorAll('[data-value]')) {
            const on = b === btn;
            b.setAttribute('aria-pressed', String(on));
            b.classList.toggle('hf-btn--soft', on);
            b.classList.toggle('hf-btn--ghost', !on);
          }
          const v = btn.dataset.value;
          table.data = v === 'Tümü' ? rows : rows.filter((r) => String(r[filter.key]) === v);
        };
        bar.addEventListener('click', fn);
        offs.push(() => bar.removeEventListener('click', fn));
      }
      if (onRow) {
        const fn = (e) => onRow(e.detail.row, app, el);
        table.addEventListener('hd-row', fn);
        offs.push(() => table.removeEventListener('hd-row', fn));
      }
      return () => offs.forEach((off) => off());
    },
  };
}

/** Menüde olup bu demoda ekranı yazılmamış modüller için sayfa. */
export function placeholderPage(label, source) {
  return {
    title: label,
    render: () => html`${pageHead(label)}
      <div class="hf-card"><div class="hf-empty">
        ${icon('layers')}
        <h2 class="hf-text-lg hf-bold">Bu ekran demoda yer almıyor</h2>
        <p>"${label}" modülü ${source} projesinde bulunuyor. Demo, Helios Frame ile kurulan ana ekranları ve menü yapısını gösterir.</p>
        <a class="hf-btn hf-btn--primary" href="#/">Özete dön</a>
      </div></div>`,
  };
}

/** Basit ayrıntı listesi (çekmece/diyalog içinde) */
export const detailList = (pairs) => html`<dl class="hf-stack hf-gap-2">
  ${pairs.map(([k, v]) => html`<div class="hf-cluster hf-between"><dt class="hf-muted">${k}</dt><dd class="hf-bold">${v}</dd></div>`)}
</dl>`;
