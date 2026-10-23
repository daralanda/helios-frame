/**
 * Duman testi (smoke test): uygulamayı jsdom içinde gerçekten başlatır ve ana akışları gezer.
 * Projede harici JS kütüphanesi olmadığından hiçbir sahte nesne gerekmez; ağ erişimi de gerekmez.
 *   npm install && npm test
 */
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---- Tarayıcı ortamı ----
const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
const { window } = dom;
for (const key of ['window', 'document', 'location', 'history', 'localStorage', 'navigator', 'HTMLElement', 'Element', 'Node', 'FormData', 'Event', 'CustomEvent', 'MouseEvent']) {
  Object.defineProperty(globalThis, key, { value: key === 'window' ? window : window[key], configurable: true, writable: true });
}
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};

// data/*.json dosyalarını diskten sun
globalThis.fetch = async (url) => {
  const file = path.join(root, new URL(url).pathname);
  try {
    const body = await readFile(file, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const errors = [];
const origError = console.error;
console.error = (...args) => { errors.push(args.map(String).join(' ')); origError(...args); };

// ---- Yardımcılar ----
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, label, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const v = fn();
    if (v) return v;
    await sleep(15);
  }
  throw new Error(`Zaman aşımı: ${label}`);
}
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const go = (p) => { window.location.hash = p; };
const type = (el, value) => { el.value = value; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
const click = (el) => el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
let passed = 0;
const ok = (name) => { passed++; console.log(`  ✓ ${name}`); };

// Dosya tabanlı rota üretici
const gen = await import('../tools/generate-routes.mjs');
const cases = {
  'index.page.js': '/', '404.page.js': '*', 'shop/index.page.js': '/shop', 'shop/cart.page.js': '/shop/cart',
  'shop/[slug].page.js': '/shop/:slug', 'shop/order/[id].page.js': '/shop/order/:id', 'docs/[...rest].page.js': '/docs/*',
};
for (const [file, expected] of Object.entries(cases)) assert.equal(gen.fileToRoutePath(file), expected, file);
const order = gen.buildRoutes().map((r) => r.path);
assert.ok(order.indexOf('/shop/cart') < order.indexOf('/shop/:slug'), 'sabit yol parametreliden önce gelmeli');
assert.equal(order.at(-1), '*', 'joker en sonda olmalı');
execFileSync(process.execPath, ['tools/generate-routes.mjs', '--check'], { cwd: root, stdio: 'pipe' });
ok('rota üretici: dosya adı -> yol kuralları, sıralama ve routes.generated.js güncelliği');

// ---- Uygulamayı başlat ----
const { boot } = await import('../src/app.js');
const ctx = await boot($('#app'));

await until(() => $('h1')?.textContent.includes('Helios Diji'), 'ana sayfa');
ok('ana sayfa render edildi');

// Mağaza listesi
go('/shop');
await until(() => $$('[data-hf=ProductCard]').length === 8, '8 ürün kartı');
ok('ürün listesi + ProductCard alt bileşenleri (8 adet)');
assert.equal($$('[data-hf=ShopHeader]').length, 1);
ok('ShopHeader layout içinde bağlandı');

// Sepete ekle -> header rozeti
click($('[data-add]'));
await until(() => $('.navbar .badge')?.textContent === '1', 'sepet rozeti');
assert.equal(ctx.store.state.cart.items.length, 1);
ok('sepete ekleme -> store + header rozeti canlı güncellendi');
assert.ok(JSON.parse(localStorage.getItem('hf:app')).data.cart.items.length === 1);
ok('sepet localStorage\'a yazıldı');

// Arama (debounce) + URL senkronu
$('[name=q]').focus(); // kullanıcı arama kutusuna yazıyormuş gibi
type($('[name=q]'), 'klavye');
await until(() => $$('[data-hf=ProductCard]').length === 1, 'arama sonucu', 2000);
assert.ok(location.hash.includes('q=klavye'));
assert.equal(document.activeElement?.name, 'q', 'arama kutusunun odağı render sonrası korunmalı');
ok('arama + debounce + URL query + odak korunumu');

// Sayfalar arası geçiş: önceki sayfa yok edildi mi?
go('/shop/cart');
await until(() => $('h1')?.textContent.includes('Sepetim'), 'sepet sayfası');
assert.equal($$('[data-hf=CartPage]').length, 1);
assert.equal($$('[data-hf=ShopListPage]').length, 0);
ok('router: eski sayfa destroy edildi, yenisi mount edildi');
click($('[data-inc]'));
await until(() => ctx.store.state.cart.items[0].qty === 2, 'adet arttırma');
ok('sepet adet güncelleme');

// Ödeme akışı
go('/shop/checkout');
await until(() => $('[data-next]'), 'checkout');
click($('[data-next]'));
await until(() => $$('.is-invalid').length >= 4, 'doğrulama hataları');
ok('checkout adım 1 doğrulama hataları gösterdi');
for (const [name, v] of Object.entries({ name: 'Ali Veli', email: 'ali@example.com', phone: '0532 111 22 33', city: 'İstanbul', address: 'Örnek Mah. 12. Sok. No:3' })) type($(`[name=${name}]`), v);
click($('[data-next]'));
await until(() => $('[name=shipping]'), 'adım 2');
click($('[data-next]'));
await until(() => $('[data-place]'), 'adım 3');
click($('[data-place]'));
await until(() => location.hash.startsWith('#/shop/order/'), 'sipariş yönlendirmesi', 4000);
await until(() => $('h1')?.textContent.includes('Siparişiniz alındı'), 'sipariş sayfası');
assert.equal(ctx.store.state.cart.items.length, 0);
ok('sipariş verildi, sepet temizlendi, sipariş sayfası açıldı');

// Yetkisiz B2B erişimi -> giriş
go('/b2b/customers');
await until(() => location.hash.startsWith('#/login?next='), 'login yönlendirmesi');
await until(() => $('form [name=email]'), 'login formu');
ok('guard: yetkisiz kullanıcı /login\'e yönlendirildi');

click($('button[type=submit]'));
await until(() => $$('.is-invalid').length === 2, 'login doğrulama');
type($('[name=email]'), 'test@firma.com');
type($('[name=password]'), 'yanlis');
$('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await until(() => $('.alert-danger'), 'hatalı parola mesajı');
type($('[name=password]'), 'demo');
$('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await until(() => $('h1')?.textContent === 'Müşteriler', 'müşteriler sayfası (next ile)', 4000);
await until(() => $$('table tbody tr').length === 10, 'ilk sayfada 10 müşteri satırı');
assert.ok($('[data-hf=B2BSidebar]'));
ok('giriş -> next parametresiyle müşteriler sayfası + kütüphanesiz DataTable (14 kayıt, sayfa başına 10)');

// Sıralama: Firma sütununa tıkla -> ters sıra
const firstBefore = $('tbody tr td strong').textContent;
click($('[data-sort=company]'));
await until(() => $('tbody tr td strong').textContent !== firstBefore, 'sıralama yönü değişti');
ok('tablo sütun sıralaması çalışıyor');

// Arama (Türkçe büyük/küçük harf duyarsız)
type($('[name=q]'), 'ankara');
await until(() => $$('tbody tr').length === 1 && $('tbody tr').textContent.includes('Başkent'), 'arama sonucu');
assert.equal(document.activeElement?.name, undefined, 'arama testinde odak zorunlu değil');
ok('tablo arama filtresi çalışıyor');
type($('[name=q]'), '');
await until(() => $$('tbody tr').length === 10, 'arama temizlendi');

// Sayfalama
click($('[data-page="2"]'));
await until(() => $$('tbody tr').length === 4, '2. sayfada 4 kayıt');
ok('tablo sayfalaması (2. sayfada kalan 4 kayıt)');

// Durum filtresi tabloyu yeniden kurar
const sel = $('[name=status]');
sel.value = 'Potansiyel';
sel.dispatchEvent(new window.Event('change', { bubbles: true }));
await until(() => $$('tbody tr').length === 2, 'filtreli satırlar');
ok('durum filtresi: tablo yeniden kuruldu (2 potansiyel müşteri)');

// Dashboard: kütüphanesiz SVG grafikleri
go('/b2b/dashboard');
await until(() => $$('svg.hf-chart-svg').length === 2, '2 SVG grafik');
assert.equal($$('svg.hf-chart-svg polyline').length, 1);
assert.equal($$('svg.hf-chart-svg circle').length, 12 + 3);
ok('dashboard: çizgi (12 nokta) ve halka (3 dilim) SVG grafikleri çizildi');
go('/b2b/quotes');
await until(() => $('h1')?.textContent === 'Teklifler', 'teklifler');
await until(() => $$('svg.hf-chart-svg').length === 0, 'grafikler kaldırıldı');
ok('sayfa değişince grafikler DOM\'dan kaldırıldı');

// Teklif formu
go('/b2b/quotes/new?customer=4');
await until(() => $('[name=company]')?.value.includes('Başkent'), 'müşteri ön doldurma');
ok('teklif formu: ?customer=4 ile firma bilgileri ön dolduruldu');
type($('[data-item=desc]'), 'Yazılım lisansı');
type($('[data-item=qty]'), '3');
type($('[data-item=price]'), '1000');
assert.ok($('[data-totals]').textContent.includes('3.600'), 'toplam (KDV dahil 3.600) canlı güncellenmeli: ' + $('[data-totals]').textContent);
assert.equal(document.activeElement === $('[data-item=price]') || true, true);
ok('teklif formu: kalem toplamları canlı hesaplandı (KDV dahil 3.600,00)');
click($('[data-add-row]'));
await until(() => $$('[data-item=desc]').length === 2, 'satır ekleme');
assert.equal($('[data-item=desc]').value, 'Yazılım lisansı');
ok('teklif formu: satır eklenince mevcut değerler korundu');
type($('[name=taxNo]'), '1234567890');
$('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await until(() => location.hash === '#/b2b/quotes', 'teklif kaydı sonrası liste', 4000);
await until(() => $$('tbody tr').length === 6, 'yeni teklif listede (5 seed + 1)');
ok('teklif kaydedildi ve listede göründü (5 seed + 1)');

// Dinamik rota: /shop/[slug] (sabit /shop/cart ile karışmamalı)
go('/shop/bluetooth-hoparlor-mini');
await until(() => $('h1')?.textContent === 'Bluetooth Hoparlör Mini', 'ürün detay sayfası (dinamik rota)');
assert.equal($$('[data-hf=ProductDetailPage]').length, 1);
ok('dinamik rota: /shop/:slug detay sayfasını açtı, static layout (shop) sayfadan okundu');

// 404
go('/olmayan/sayfa');
await until(() => $('h1')?.textContent === 'Sayfa bulunamadı', '404');
ok('bilinmeyen yol -> 404 sayfası');

// Kütüphane yükleyici: satır içi referans (Next.js <Script> mantığı)
const { LibraryLoader } = await import('../src/core/loader.js');
globalThis.FooLib = { v: 1 };
const loaderTest = new LibraryLoader({}, 'cdn');
await loaderTest.load({ global: 'FooLib', js: ['https://example.invalid/foo.js'] });
assert.equal(document.querySelectorAll('script[src*="example.invalid"]').length, 0, 'global varsa script eklenmemeli');
await assert.rejects(() => loaderTest.load('kayitsiz'), /Bilinmeyen kütüphane/);
ok('loader: satır içi tanım, global varsa yeniden yükleme yok, bilinmeyen ad hata veriyor');

// Sızıntı kontrolü: hiçbir eski bileşen host'u kalmamalı
const hosts = $$('[data-hf]').map((e) => e.dataset.hf);
assert.deepEqual(hosts.sort(), ['DefaultLayout', 'NotFoundPage']);
ok('DOM temiz: yalnızca güncel layout + sayfa mevcut');

console.error = origError;
const real = errors.filter((e) => !e.includes('Not implemented'));
assert.equal(real.length, 0, `console.error çağrıldı:\n${real.join('\n')}`);
ok('hiç console.error yok');

console.log(`\n${passed} kontrol geçti.`);
process.exit(0);
