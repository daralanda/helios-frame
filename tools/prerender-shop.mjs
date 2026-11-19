#!/usr/bin/env node
/**
 * Helios Frame · Mağaza sayfalarını statik HTML olarak üretir (SEO için).
 * YALNIZCA geliştirme/yayın öncesi çalıştırılır; canlı sunucuda Node gerekmez.
 *
 *   node tools/prerender-shop.mjs
 *
 * Örnek mağaza (examples/shop) için çalışır; kendi projenizde yolları uyarlayın.
 * Girdi : examples/data/products.json, examples/config/project.config.json
 * Çıktı : examples/shop/index.html, examples/shop/urun/<slug>.html, examples/sitemap.xml, robots.txt
 *
 * Gerçek projede ürünler .NET API'den geliyorsa iki seçenek vardır:
 *  1) Bu betiği API'den JSON çekecek şekilde uyarlayıp yayın öncesi (GitHub Actions) çalıştırmak,
 *  2) Aynı şablonları (components/templates.js) sunucu tarafında Razor ile karşılamak.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { html, escapeHTML } from '../core/dom.js';
import { createFormat, slugify } from '../core/format.js';
import { createI18n } from '../core/i18n.js';
import { deepMerge, DEFAULTS } from '../core/config.js';
import { productSchema, breadcrumbSchema, serializeJsonLd } from '../core/seo.js';
import { productCardTpl, ratingTpl, priceTpl, iconTpl } from '../components/templates.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONFIG = 'examples/config/project.config.json';
const read = async (p) => JSON.parse(await readFile(join(ROOT, p), 'utf8'));

const config = deepMerge(DEFAULTS, await read(CONFIG));
const products = await read('examples/data/products.json');
const SITE = String(config.seo.siteUrl || 'https://example.com').replace(/\/+$/, '');
const CATS = config.shop?.categories ?? {};
const fmt = createFormat({ locale: config.locale, currency: config.currency });
const { t } = createI18n({ locale: config.locale, ...config.i18n });
const abs = (p) => `${SITE}/${String(p).replace(/^\/+/, '')}`;

/** Sayfa derinliğine göre göreli yol yardımcısı */
const helpers = (prefix) => ({ fmt, t, url: (p) => (/^(?:[a-z]+:|#)/i.test(p) ? p : prefix + String(p).replace(/^\.?\//, '')) });

function page({ prefix, title, description, canonical, type = 'website', image, jsonld = [], body, extraHead = '', scripts = [] }) {
  const h = helpers(prefix);
  const fullTitle = config.seo.titleTemplate.replace('%s', title);
  return `<!doctype html>
<html lang="${config.locale.split('-')[0]}" data-theme-default="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${escapeHTML(fullTitle)}</title>
  <meta name="description" content="${escapeHTML(description)}">
  <link rel="canonical" href="${escapeHTML(canonical)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${escapeHTML(config.seo.siteName)}">
  <meta property="og:title" content="${escapeHTML(title)}">
  <meta property="og:description" content="${escapeHTML(description)}">
  <meta property="og:url" content="${escapeHTML(canonical)}">
  <meta property="og:image" content="${escapeHTML(abs(image || config.seo.defaultImage))}">
  <meta property="og:locale" content="${config.locale.replace('-', '_')}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="hf-config" content="${CONFIG}">
${extraHead}  <link rel="icon" href="${h.url('assets/img/logo.svg')}" type="image/svg+xml">
  <link rel="preload" href="${h.url('theme/fonts/inter-latin.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${h.url('theme/tokens.css')}">
  <link rel="stylesheet" href="${h.url('theme/base.css')}">
  <link rel="stylesheet" href="${h.url('theme/layout.css')}">
  <link rel="stylesheet" href="${h.url('theme/components.css')}">
  <link rel="stylesheet" href="${h.url('theme/utilities.css')}">
  <link rel="stylesheet" href="${h.url('examples/demo.css')}">
  <script src="${h.url('core/theme-boot.js')}"></script>
  <link rel="modulepreload" href="${h.url('core/app.js')}">
  <script type="module" src="${h.url('core/app.js')}"></script>
${scripts.map((s) => `  <script type="module" src="${h.url(s)}"></script>\n`).join('')}${jsonld.map((d) => `  <script type="application/ld+json">${serializeJsonLd(d)}</script>\n`).join('')}</head>
<body>
<!-- Bu dosya tools/prerender-shop.mjs ile üretildi. Elle düzenlemeyin. -->
<hd-shell nav="horizontal" menu="shop" search cart>
${body.toString()}
</hd-shell>
</body>
</html>
`;
}

function breadcrumb(h, items) {
  return html`<nav class="hf-breadcrumb" aria-label="Konum"><ol>
    ${items.map((it, i) => (i === items.length - 1
      ? html`<li><span aria-current="page">${it.name}</span></li>`
      : html`<li><a href="${h.url(it.href)}">${it.name}</a></li>`))}
  </ol></nav>`;
}

/* ---------------- Liste sayfası ---------------- */
async function listing() {
  const prefix = '../../';
  const h = helpers(prefix);
  const crumbs = [{ name: 'Örnekler', href: 'examples/' }, { name: 'Mağaza', href: 'examples/shop/' }];
  const counts = Object.fromEntries(Object.keys(CATS).map((k) => [k, products.filter((p) => p.cat === k).length]));
  const body = html`
  ${breadcrumb(h, crumbs)}
  <header class="hf-page__head hf-mt-4">
    <div><h1 class="hf-page__title">Endüstriyel IoT ürünleri</h1>
      <p class="hf-page__desc">Sensör, ağ geçidi, röle ve enerji izleme çözümleri. Bayilere özel fiyat için giriş yapın.</p></div>
  </header>
  <div class="shop-layout">
    <aside class="shop-filters hf-card" aria-labelledby="filter-title"><div class="hf-card__body hf-stack">
      <h2 class="hf-sr-only" id="filter-title">Filtreler</h2>
      <fieldset><legend>Kategori</legend>
        ${Object.entries(CATS).map(([k, name]) => html`<label class="hf-check"><input type="checkbox" name="k" value="${k}"> ${name} <span class="hf-subtle">(${counts[k]})</span></label>`)}
      </fieldset>
      <fieldset><legend>Stok</legend>
        <label class="hf-check"><input class="hf-switch" type="checkbox" role="switch" name="stock"> Yalnızca stoktakiler</label>
      </fieldset>
    </div></aside>
    <section aria-labelledby="results-title">
      <div class="hf-cluster hf-between">
        <h2 class="hf-text-sm hf-muted" id="results-title" aria-live="polite"><span data-count>${products.length}</span> ürün</h2>
        <label class="hf-cluster hf-gap-2 hf-text-sm">Sırala
          <select class="hf-select hf-w-auto" name="sort">
            <option value="">Önerilen</option><option value="price-asc">Fiyat (artan)</option>
            <option value="price-desc">Fiyat (azalan)</option><option value="name">Ada göre</option>
          </select></label>
      </div>
      <div class="hf-grid hf-grid--products hf-mt-4" data-products>
        ${products.map((p, i) => productCardTpl(h, p, { eager: i < 3, headingLevel: 3 }))}
      </div>
      <div class="hf-empty" data-empty hidden>${iconTpl(h, 'search')}<p>Filtrelere uyan ürün yok.</p></div>
    </section>
  </div>`;
  const ld = [
    breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: abs(c.href) }))),
    {
      '@context': 'https://schema.org', '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(p.url), name: p.name })),
    },
  ];
  return page({
    prefix, title: 'Endüstriyel IoT ürünleri', canonical: abs('examples/shop/'),
    description: 'Helios Diji mağaza: LoRaWAN sensörler, ağ geçitleri, akıllı röleler ve enerji analizörleri. Hızlı kargo, 2 yıl garanti.',
    jsonld: ld, body, scripts: ['examples/shop/shop.js'],
  });
}

/* ---------------- Ürün detay sayfası ---------------- */
function detail(p) {
  const prefix = '../../../';
  const h = helpers(prefix);
  const catName = CATS[p.cat] ?? p.cat;
  const crumbs = [
    { name: 'Örnekler', href: 'examples/' }, { name: 'Mağaza', href: 'examples/shop/' },
    { name: catName, href: `examples/shop/?k=${p.cat}` }, { name: p.name, href: p.url },
  ];
  const related = products.filter((x) => x.id !== p.id && (x.cat === p.cat || x.stock > 0)).slice(0, 4);
  const inStock = p.stock > 0;
  const body = html`
  ${breadcrumb(h, crumbs)}
  <div class="pdp hf-mt-6">
    <div class="pdp__media"><img src="${h.url(p.image)}" alt="${p.name}" width="800" height="800" fetchpriority="high" decoding="async"></div>
    <div class="pdp__buy">
      <span class="hf-product__brand">${p.brand} · ${p.id}</span>
      <h1>${p.name}</h1>
      ${ratingTpl(p)}
      <div>${priceTpl(h, p)} <span class="hf-text-xs hf-muted">KDV dahil</span></div>
      <div>${inStock ? html`<span class="hf-badge hf-badge--success hf-badge--dot">Stokta · ${p.stock > 50 ? '50+' : p.stock} adet</span>`
        : html`<span class="hf-badge hf-badge--danger hf-badge--dot">Tükendi</span>`}</div>
      <p class="hf-muted">${p.desc}</p>
      <div class="hf-cluster">
        <label class="hf-sr-only" for="adet">Adet</label>
        <hd-qty><input type="number" id="adet" name="adet" value="1" min="1" max="${Math.max(1, Math.min(99, p.stock))}" inputmode="numeric" ${inStock ? '' : html`disabled`}></hd-qty>
        <button type="button" class="hf-btn hf-btn--primary hf-btn--lg hf-grow" ${inStock ? '' : html`disabled`}
          data-cart-add data-qty-from="#adet" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image}" data-url="${p.url}">${iconTpl(h, 'cart')}${t('cart.add')}</button>
      </div>
      <ul class="pdp__usp" role="list">
        <li>${iconTpl(h, 'truck')}15:00'e kadar verilen siparişler aynı gün kargoda</li>
        <li>${iconTpl(h, 'shield')}2 yıl üretici garantisi</li>
        <li>${iconTpl(h, 'check')}Bayilere özel fiyat ve vadeli ödeme</li>
      </ul>
    </div>
  </div>
  <div class="hf-card hf-mt-8"><div class="hf-card__body">
    <hd-tabs label="Ürün bilgileri">
      <section data-tab="Açıklama"><p>${p.desc} Helios Cloud ile uyumludur; veriler Türkiye'deki sunucularda KVKK'ya uygun şekilde saklanır.</p></section>
      <section data-tab="Teknik özellikler"><table class="hf-table"><tbody>
        <tr><th scope="row">Ürün kodu</th><td>${p.id}</td></tr>
        <tr><th scope="row">Kategori</th><td>${catName}</td></tr>
        <tr><th scope="row">Garanti</th><td>24 ay</td></tr>
      </tbody></table></section>
      <section data-tab="Teslimat ve iade"><p>Stoktaki ürünler 1-3 iş gününde teslim edilir. 14 gün içinde koşulsuz iade.</p></section>
    </hd-tabs>
  </div></div>
  <section class="hf-mt-12 hf-defer" aria-labelledby="related-title">
    <h2 id="related-title">Benzer ürünler</h2>
    <div class="hf-grid hf-grid--products hf-mt-4">${related.map((r) => productCardTpl(h, r))}</div>
  </section>`;
  const productUrl = abs(p.url);
  return page({
    prefix, title: p.name, canonical: productUrl, type: 'product', image: p.image,
    description: `${p.desc} ${fmt.money(p.price)} · Helios Diji.`.slice(0, 160),
    extraHead: `  <meta property="product:price:amount" content="${Number(p.price).toFixed(2)}">\n  <meta property="product:price:currency" content="${config.currency}">\n`,
    jsonld: [
      productSchema({ ...p, sku: p.id, description: p.desc, url: productUrl, images: [abs(p.image)] }, config.currency),
      breadcrumbSchema(crumbs.map((c) => ({ name: c.name, url: abs(c.href) }))),
    ],
    body,
  });
}

/* ---------------- Yazma ---------------- */
for (const p of products) {
  if (p.slug !== slugify(p.slug)) throw new Error(`Geçersiz slug: ${p.slug}`);
}
await rm(join(ROOT, 'examples/shop/urun'), { recursive: true, force: true });
await mkdir(join(ROOT, 'examples/shop/urun'), { recursive: true });
await writeFile(join(ROOT, 'examples/shop/index.html'), await listing());
for (const p of products) await writeFile(join(ROOT, `examples/shop/urun/${p.slug}.html`), detail(p));

const urls = [
  { loc: abs('examples/'), priority: '1.0' },
  { loc: abs('examples/shop/'), priority: '0.9' },
  ...products.map((p) => ({ loc: abs(p.url), priority: '0.8', image: abs(p.image) })),
];
await writeFile(join(ROOT, 'examples/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `  <url><loc>${escapeHTML(u.loc)}</loc><priority>${u.priority}</priority>${u.image ? `<image:image><image:loc>${escapeHTML(u.image)}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>
`);
await writeFile(join(ROOT, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /examples/b2b/
Disallow: /examples/crm/
Disallow: /examples/hr/

Sitemap: ${abs('examples/sitemap.xml')}
`);
console.log(`Üretildi: examples/shop + ${products.length} ürün sayfası, examples/sitemap.xml, robots.txt`);
