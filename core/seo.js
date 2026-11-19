/**
 * Helios Frame · SEO yardımcıları.
 *
 * ÖNEMLİ: Arama motorları için asıl meta etiketleri ve içerik HTML dosyasında (sunucuda)
 * bulunmalıdır. Bu modül;
 *   - SPA bölümlerinde (panel) sayfa değiştikçe başlık/meta güncellemek,
 *   - JSON-LD yapısal verisini güvenli biçimde üretmek,
 *   - prerender/sunucu tarafında aynı fonksiyonlarla tutarlı çıktı almak
 * için kullanılır. DOM'a yalnızca createElement/textContent ile yazar (innerHTML yok).
 */
import { trustedScript } from './dom.js';

function upsertMeta(attr, key, content) {
  if (content == null || content === '') return;
  let el = document.head.querySelector(`meta[${attr}="${CSS.escape(key)}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.append(el);
  }
  el.setAttribute('content', String(content));
}

function upsertLink(rel, href, extra = {}) {
  if (!href) return;
  const sel = `link[rel="${rel}"]${extra.hreflang ? `[hreflang="${CSS.escape(extra.hreflang)}"]` : ''}`;
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
    document.head.append(el);
  }
  el.href = href;
}

/**
 * setMeta({ title, description, canonical, image, type, robots, alternates: { en: url } }, seoConfig)
 */
export function setMeta(meta = {}, seo = {}) {
  const tpl = seo.titleTemplate || '%s';
  if (meta.title) document.title = tpl.replace('%s', meta.title);
  upsertMeta('name', 'description', meta.description);
  upsertMeta('name', 'robots', meta.robots);
  const canonical = meta.canonical ? new URL(meta.canonical, location.href).href : null;
  upsertLink('canonical', canonical);
  for (const [lang, href] of Object.entries(meta.alternates ?? {})) {
    upsertLink('alternate', new URL(href, location.href).href, { hreflang: lang });
  }
  // Open Graph + Twitter
  upsertMeta('property', 'og:title', meta.title);
  upsertMeta('property', 'og:description', meta.description);
  upsertMeta('property', 'og:type', meta.type || 'website');
  upsertMeta('property', 'og:url', canonical || location.href);
  upsertMeta('property', 'og:site_name', seo.siteName);
  const image = meta.image || seo.defaultImage;
  if (image) upsertMeta('property', 'og:image', new URL(image, location.href).href);
  upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
  upsertMeta('name', 'twitter:site', seo.twitter);
}

/** JSON'u <script> içine güvenle gömülebilir hale getirir (</script> kaçışı). */
export function serializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** JSON-LD ekler/günceller. id ile aynı blok tekrar eklenmez. */
export function jsonLd(data, id) {
  let el = id ? document.getElementById(id) : null;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    if (id) el.id = id;
    document.head.append(el);
  }
  el.textContent = trustedScript(serializeJsonLd(data));
  return el;
}

const abs = (u) => (u ? new URL(u, globalThis.location?.href ?? 'https://example.com/').href : undefined);

/* ---------------- Schema.org üreticileri (saf fonksiyonlar) ---------------- */

export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      ...(it.url ? { item: abs(it.url) } : {}),
    })),
  };
}

export function organizationSchema(org = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': org.type || 'Organization',
    name: org.name,
    url: abs(org.url),
    logo: abs(org.logo),
    ...(org.email ? { email: org.email } : {}),
    ...(org.telephone ? { telephone: org.telephone } : {}),
    ...(org.sameAs ? { sameAs: org.sameAs } : {}),
    ...(org.address ? { address: { '@type': 'PostalAddress', ...org.address } } : {}),
  };
}

export function websiteSchema({ name, url, searchUrl } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: abs(url),
    ...(searchUrl ? {
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: abs(searchUrl) + '{search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    } : {}),
  };
}

/** p: { name, sku, brand, description, images[], price, currency, stock, url, rating, reviewCount } */
export function productSchema(p, currency = 'TRY') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.description,
    image: (p.images ?? [p.image]).filter(Boolean).map(abs),
    ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
    offers: {
      '@type': 'Offer',
      url: abs(p.url),
      price: Number(p.price).toFixed(2),
      priceCurrency: p.currency || currency,
      availability: `https://schema.org/${p.stock > 0 ? 'InStock' : 'OutOfStock'}`,
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(p.rating && p.reviewCount ? {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviewCount },
    } : {}),
  };
}

export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
