// Çekirdek birim testleri · node --test tests/   (bağımlılık yok)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, raw, escapeHTML, safeUrl, SafeHTML } from '../core/dom.js';
import { createStore } from '../core/store.js';
import { deepMerge, url } from '../core/config.js';
import { themeToVars, readableOn, contrast, parseColor } from '../core/theme.js';
import { validators, masks } from '../core/validate.js';
import { createFormat, slugify } from '../core/format.js';
import { createI18n } from '../core/i18n.js';
import { serializeJsonLd, productSchema, breadcrumbSchema } from '../core/seo.js';
import { normalizeMenu, matchScore, activeTrail } from '../components/menu.js';
import { query } from '../components/table.js';
import { cartTotals } from '../components/commerce.js';
import { niceMax } from '../components/chart.js';
import { hasRole } from '../core/app.js';

test('escapeHTML tüm tehlikeli karakterleri kaçırır', () => {
  assert.equal(escapeHTML(`<img src=x onerror="a('b')">\``), '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt;&#96;');
  assert.equal(escapeHTML(null), '');
});

test('html`` değerleri escape eder, iç içe şablonları korur', () => {
  const user = '<script>alert(1)</script>';
  const out = html`<p>${user}</p>${html`<b>${'x'}</b>`}${[1, 2].map((n) => html`<i>${n}</i>`)}`;
  assert.ok(out instanceof SafeHTML);
  assert.equal(out.value, '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><b>x</b><i>1</i><i>2</i>');
  assert.equal(html`${raw('<hr>')}`.value, '<hr>');
  assert.equal(html`${false}${undefined}`.value, '');
});

test('html`` href/src içindeki javascript: adresini etkisizleştirir', () => {
  assert.equal(html`<a href="${'javascript:alert(1)'}">x</a>`.value, '<a href="#">x</a>');
  assert.equal(html`<a href="${' JaVaScRiPt:alert(1)'}">x</a>`.value, '<a href="#">x</a>');
  assert.equal(html`<img src="${'data:text/html;base64,xx'}">`.value, '<img src="#">');
  assert.equal(html`<a href="${'/urun?a=1&b=2'}">x</a>`.value, '<a href="/urun?a=1&amp;b=2">x</a>');
  // URL olmayan özniteliklerde dokunulmaz (yalnızca escape)
  assert.equal(html`<a title="${'javascript:x'}">`.value, '<a title="javascript:x">');
});

test('safeUrl izinli protokoller', () => {
  for (const ok of ['https://a.com', 'http://a.com', 'mailto:a@b.c', 'tel:+905', '/x', './x', '../x', '#a', '?q=1', 'urun.html']) {
    assert.equal(safeUrl(ok), ok, ok);
  }
  for (const bad of ['javascript:alert(1)', 'vbscript:x', 'data:text/html,x', 'java\tscript:alert(1)']) {
    assert.equal(safeUrl(bad), '#', bad);
  }
});

test('store: toplu bildirim, seçici abonelik, kalıcılık, prototip koruması', async () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  const s = createStore({ a: 1, cart: [] }, { persist: { key: 't', keys: ['cart'] }, storage });
  const calls = [];
  s.subscribe((st, keys) => calls.push(keys), ['cart']);
  s.state.a = 2;
  s.state.cart = [1];
  s.update('cart', (c) => [...c, 2]);
  await Promise.resolve();
  assert.deepEqual(calls, [['a', 'cart']]);
  assert.deepEqual(JSON.parse(mem.get('t')).d, { cart: [1, 2] });
  s.state.a = 3;
  await Promise.resolve();
  assert.equal(calls.length, 1, 'cart dışı değişiklik aboneyi tetiklememeli');
  assert.equal(Reflect.set(s.state, '__proto__', {}), false);

  const again = createStore({ cart: [] }, { persist: { key: 't', keys: ['cart'] }, storage });
  assert.deepEqual(again.get('cart'), [1, 2]);
});

test('deepMerge prototype pollution engeller', () => {
  const evil = JSON.parse('{"__proto__":{"polluted":true},"a":{"constructor":{"x":1},"b":2}}');
  const out = deepMerge({ a: { c: 1 } }, evil);
  assert.equal({}.polluted, undefined);
  assert.deepEqual(out, { a: { c: 1, b: 2 } });
});

test('tema: marka renginden kontrastlı yazı rengi ve bileşen değişkenleri', () => {
  assert.deepEqual(parseColor('#f47b20'), [244, 123, 32]);
  assert.deepEqual(parseColor('#fff'), [255, 255, 255]);
  assert.equal(readableOn('#f47b20'), '#1c1f22');   // açık turuncu -> koyu yazı
  assert.equal(readableOn('#1d4ed8'), '#ffffff');   // koyu mavi -> beyaz yazı
  assert.ok(contrast([0, 0, 0], [255, 255, 255]) > 20);
  const v = themeToVars({
    colors: { brand: '#1d4ed8', accent: 'red;}body{x' },
    radius: '8px',
    components: { card: { radius: '18px', shadow: 'none', bad: 'url(javascript:x)' } },
  });
  assert.equal(v['--hf-brand'], '#1d4ed8');
  assert.equal(v['--hf-on-brand'], '#ffffff');
  assert.equal(v['--hf-accent'], undefined, 'geçersiz renk reddedilmeli');
  assert.equal(v['--hf-radius'], '8px');
  assert.equal(v['--hf-radius-lg'], '11px');
  assert.equal(v['--hf-card-radius'], '18px');
  assert.equal(v['--hf-card-shadow'], 'none');
  assert.equal(v['--hf-card-bad'], undefined, 'url() içeren değer reddedilmeli');
});

test('doğrulayıcılar: TCKN, VKN, IBAN, telefon, e-posta', () => {
  assert.equal(validators.tckn('10000000146'), true);
  assert.equal(validators.tckn('12345678901'), false);
  assert.equal(validators.tckn('01234567890'), false);
  assert.equal(validators.vkn('1234567890'), true);  // algoritmaya göre geçerli
  assert.equal(validators.vkn('1234567891'), false);
  assert.equal(validators.vkn('12345'), false);
  assert.equal(validators.vkn('0010000014'), (() => {
    // referans hesap
    const d = [...'0010000014'].map(Number); let sum = 0;
    for (let i = 0; i < 9; i++) { const t = (d[i] + 10 - (i + 1)) % 10; sum += t === 9 ? 9 : (t * 2 ** (10 - (i + 1))) % 9; }
    return (10 - (sum % 10)) % 10 === d[9];
  })());
  assert.equal(validators.iban('TR33 0006 1005 1978 6457 8413 26'), true);
  assert.equal(validators.iban('TR33 0006 1005 1978 6457 8413 27'), false);
  assert.equal(validators.phone('0532 123 45 67'), true);
  assert.equal(validators.phone('+90 (212) 555 12 12'), true);
  assert.equal(validators.phone('123'), false);
  assert.equal(validators.email('a@b.co'), true);
  assert.equal(validators.email('a@b'), false);
});

test('maskeler', () => {
  assert.equal(masks.phone('5321234567'), '0532 123 45 67');
  assert.equal(masks.phone('+905321234567'), '0532 123 45 67');
  assert.equal(masks.iban('tr330006100519786457841326'), 'TR33 0006 1005 1978 6457 8413 26');
  assert.equal(masks.digits('12a3'), '123');
});

test('biçimlendirme (tr-TR) ve slug', () => {
  const f = createFormat({ locale: 'tr-TR', currency: 'TRY' });
  assert.match(f.money(1499.9), /1\.499,90/);
  assert.equal(f.number(1234567), '1.234.567');
  assert.equal(f.relative(Date.now() - 3 * 864e5), '3 gün önce');
  assert.equal(slugify('Endüstriyel Sensör ÇİĞ Işık'), 'endustriyel-sensor-cig-isik');
});

test('i18n: parametre, çoğul, çok dilli etiket', () => {
  const { t, label } = createI18n({ locale: 'tr-TR', messages: { tr: { hi: 'Merhaba {name}' } } });
  assert.equal(t('hi', { name: 'Ayşe' }), 'Merhaba Ayşe');
  assert.equal(t('cart.items', { n: 3 }), '3 ürün');
  assert.equal(t('yok.boyle'), 'yok.boyle');
  assert.equal(label({ tr: 'Ürünler', en: 'Products' }), 'Ürünler');
  assert.equal(createI18n({ locale: 'en-US' }).t('cart.items', { n: 1 }), '1 item');
});

test('JSON-LD </script> kaçışı ve şema üretimi', () => {
  const s = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
  assert.ok(!s.includes('<'));
  const p = productSchema({ name: 'X', price: 10, stock: 0, url: 'https://a.com/x', images: ['https://a.com/x.svg'] });
  assert.equal(p.offers.price, '10.00');
  assert.equal(p.offers.availability, 'https://schema.org/OutOfStock');
  assert.equal(breadcrumbSchema([{ name: 'A', url: 'https://a.com/' }, { name: 'B' }]).itemListElement[1].item, undefined);
});

test('menü: rol filtresi, gruplama', () => {
  const menu = [
    { label: 'Panel', href: 'p/' },
    { group: 'Yönetim', roles: ['admin'], items: [{ label: 'Kullanıcılar', href: 'u/' }] },
    { group: 'Satış', items: [
      { label: 'Gizli', href: 'g/', roles: ['admin'] },
      { label: 'Teklif', children: [{ label: 'Yeni', href: 't/yeni', roles: ['admin'] }] },
      { label: 'Müşteri', href: 'm/' },
    ] },
  ];
  const guest = normalizeMenu(menu, { roles: ['sales'] });
  assert.deepEqual(guest.map((g) => g.title), [null, 'Satış']);
  assert.deepEqual(guest[1].items.map((i) => i.label), ['Müşteri'], 'boş alt menü ve yetkisiz öğe gizlenmeli');
  const admin = normalizeMenu(menu, { roles: ['admin'] });
  assert.equal(admin.length, 3);
  assert.equal(hasRole(null, ['admin']), false);
  assert.equal(hasRole(null, []), true);
});

test('menü: aktif öğe puanlama (hash rotaları ve yollar)', () => {
  const loc = (href) => new URL(href);
  const l = loc('https://x.com/demo/panel/#/teklifler/yeni');
  assert.equal(matchScore('/demo/panel/#/teklifler/yeni', l), 10000);
  assert.ok(matchScore('/demo/panel/#/teklifler', l) > 1000);
  assert.equal(matchScore('/demo/panel/#/musteriler', l), 0);
  assert.equal(matchScore('/demo/shop/', l), 0);
  assert.equal(matchScore('/demo/shop/', loc('https://x.com/demo/shop/index.html')), 5000);
  assert.ok(matchScore('/demo/shop/', loc('https://x.com/demo/shop/urun/a.html')) > 0);
  assert.equal(matchScore('https://baska.com/demo/shop/', loc('https://x.com/demo/shop/')), 0);
  // menu.json yolları framework köküne göredir; url() ile çözülür
  const here = new URL(`https://x.com${url('demo/panel/#/teklifler/yeni')}`);
  const trail = activeTrail(normalizeMenu([{ group: 'S', items: [{ label: 'Teklifler', children: [{ label: 'Yeni', href: 'demo/panel/#/teklifler/yeni' }] }] }]), here);
  assert.deepEqual(trail.map((t) => t.label), ['Teklifler', 'Yeni']);
});

test('tablo: Türkçe duyarlı arama ve sıralama', () => {
  const rows = [{ n: 'İzmir', v: 10 }, { n: 'ankara', v: 2 }, { n: 'Çorum', v: 30 }, { n: 'Istanbul', v: 5 }];
  const cols = [{ key: 'n' }, { key: 'v', type: 'number' }];
  assert.deepEqual(query(rows, { search: 'izm', columns: cols }).map((r) => r.n), ['İzmir']);
  assert.deepEqual(query(rows, { search: 'İZMİR', columns: cols }).map((r) => r.n), ['İzmir']);
  assert.deepEqual(query(rows, { sortKey: 'n', columns: cols }).map((r) => r.n), ['ankara', 'Çorum', 'Istanbul', 'İzmir']);
  assert.deepEqual(query(rows, { sortKey: 'v', sortDir: 'desc', columns: cols }).map((r) => r.v), [30, 10, 5, 2]);
});

test('sepet toplamı kuruş hassasiyeti', () => {
  assert.deepEqual(cartTotals([{ qty: 3, price: 0.1 }, { qty: 1, price: 0.2 }]), { count: 4, subtotal: 0.5 });
  assert.deepEqual(cartTotals([]), { count: 0, subtotal: 0 });
});

test('grafik eksen üst sınırı', () => {
  assert.equal(niceMax(87), 100);
  assert.equal(niceMax(1430), 1500);
  assert.equal(niceMax(0), 1);
});
