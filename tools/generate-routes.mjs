#!/usr/bin/env node
/**
 * Dosya tabanlı rota üretici (Next.js `pages/` mantığı). YALNIZCA geliştirme aracıdır;
 * canlı sitede çalışmaz, çıktısı (src/routes.generated.js) repoya eklenir ve statik olarak yayınlanır.
 *
 *   node tools/generate-routes.mjs           src/pages/ taranır, src/routes.generated.js yazılır
 *   node tools/generate-routes.mjs --check   dosya güncel değilse hata kodu 1 ile çıkar (CI/test için)
 *
 * Kurallar (src/pages/ altındaki *.page.js dosyaları):
 *   index.page.js              -> /
 *   shop/index.page.js         -> /shop
 *   shop/cart.page.js          -> /shop/cart
 *   shop/[slug].page.js        -> /shop/:slug          (dinamik parametre)
 *   shop/order/[id].page.js    -> /shop/order/:id
 *   docs/[...rest].page.js     -> /docs/*              (kalan tüm yollar)
 *   404.page.js                -> *                    (bulunamadı sayfası)
 *   _ ile başlayan dosya/klasörler yok sayılır (yardımcı modüller için).
 *
 * Sıralama: sabit segment > :parametre > joker (*). Böylece /shop/cart, /shop/:slug'tan önce gelir.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'src/pages');
const OUT = path.join(ROOT, 'src/routes.generated.js');
const SUFFIX = '.page.js';

/** 'shop/[slug].page.js' -> '/shop/:slug' */
export function fileToRoutePath(rel) {
  const parts = rel.slice(0, -SUFFIX.length).split('/');
  const last = parts[parts.length - 1];
  if (parts.length === 1 && last === '404') return '*';
  if (last === 'index') parts.pop();

  const segments = parts.map((seg) => {
    let m;
    if ((m = /^\[\.\.\.(\w+)\]$/.exec(seg))) return '*';
    if ((m = /^\[(\w+)\]$/.exec(seg))) return `:${m[1]}`;
    if (/[[\]]/.test(seg)) throw new Error(`Geçersiz dosya adı segmenti: "${seg}" (${rel})`);
    return seg;
  });
  if (segments.slice(0, -1).includes('*')) throw new Error(`[...param] yalnızca son segment olabilir: ${rel}`);
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

const rank = (seg) => (seg === '*' ? 2 : seg.startsWith(':') ? 1 : 0);

/** Sabit < parametre < joker; eşitlikte alfabetik. */
export function compareRoutes(a, b) {
  const sa = a.path.split('/').filter(Boolean);
  const sb = b.path.split('/').filter(Boolean);
  if (a.path === '*') return 1;
  if (b.path === '*') return -1;
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    if (sa[i] === undefined) return -1;
    if (sb[i] === undefined) return 1;
    const d = rank(sa[i]) - rank(sb[i]);
    if (d) return d;
    if (sa[i] !== sb[i]) return sa[i] < sb[i] ? -1 : 1;
  }
  return 0;
}

function walk(dir, base = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name))) {
    if (entry.name.startsWith('_')) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...walk(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith(SUFFIX)) out.push(rel);
  }
  return out;
}

export function buildRoutes(pagesDir = PAGES) {
  const routes = walk(pagesDir).map((rel) => ({ path: fileToRoutePath(rel), file: rel }));

  const seen = new Map();
  for (const r of routes) {
    if (seen.has(r.path)) throw new Error(`Çakışan rota "${r.path}": ${seen.get(r.path)} ve ${r.file}`);
    seen.set(r.path, r.file);
  }
  return routes.sort(compareRoutes);
}

// Tarayıcıda URL olarak import edilirken [ ] karakterleri güvenli olsun diye yüzde-kodlanır.
const importSpecifier = (file) => `./pages/${file.replace(/\[/g, '%5B').replace(/\]/g, '%5D')}`;

export function render(routes) {
  const lines = routes.map((r) => `  { path: '${r.path}', component: () => import('${importSpecifier(r.file)}') },`);
  return `/**
 * OTOMATİK ÜRETİLDİ: elle düzenlemeyin.
 * Kaynak: src/pages/ altındaki tüm *.page.js dosyaları   ·   Üretici: node tools/generate-routes.mjs
 * Layout ve meta bilgisi sayfa sınıflarındaki \`static layout\` / \`static meta\` alanlarından okunur.
 */
export const generatedRoutes = [
${lines.join('\n')}
];
`;
}

function main() {
  const next = render(buildRoutes());
  if (process.argv.includes('--check')) {
    const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (current !== next) {
      console.error('src/routes.generated.js güncel değil. Çalıştırın: node tools/generate-routes.mjs');
      process.exit(1);
    }
    console.log('Rotalar güncel.');
    return;
  }
  writeFileSync(OUT, next);
  console.log(`src/routes.generated.js yazıldı (${next.split('\n').filter((l) => l.includes('component:')).length} rota).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
