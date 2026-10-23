# Helios Frame

**Helios Diji** için geliştirilen, derleme adımı ve Node.js gerektirmeyen, paylaşımlı hosting'de (GoDaddy cPanel vb.) çalışan hafif **Vanilla JS (ES6+)** ön yüz çatısı. Next.js'in sağladığı düzeni (rota, layout, sayfa, servis katmanı) çok daha küçük ve esnek bir biçimde sunar.

> Durum: v0.1.0 · Özel (private) proje · Lisans: tüm hakları saklıdır.

## Hızlı başlangıç

> Ayrıntılı kullanım kılavuzu (örneklerle): [`docs/index.html`](docs/index.html). Sunucuda `/docs/` adresinden açılır.

**Canlıya alma (GoDaddy):** Repo içeriğini FTP / cPanel Dosya Yöneticisi ile `public_html` altına yükleyin. Hepsi bu. Varsayılan `hash` router modu sunucu ayarı gerektirmez (`/#/shop`).

**Yerelde çalıştırma:** ES modülleri `file://` ile çalışmaz, basit bir statik sunucu yeterlidir:

```bash
python3 -m http.server 8080      # veya: npx serve
# http://localhost:8080
```

**Demo:** E-ticaret `/#/shop`, B2B panel `/#/b2b` (giriş: herhangi bir e-posta + parola `demo`). Varsayılan olarak `data/*.json` ile çalışır; backend gerekmez.

**Test (yalnızca geliştirme):** `npm install && npm test`. jsdom ile uygulamayı başlatıp ana akışları (liste, sepet, ödeme, guard, tablo, grafik, teklif formu, kütüphane yükleyici) gezer. Canlı sitede Node gerekmez.

## GitHub Pages

`main` dalına her push'ta `.github/workflows/pages.yml` siteyi otomatik yayınlar (yalnızca statik dosyalar).

- Adres: `https://daralanda.github.io/helios-frame/` · kılavuz: `/docs/`
- **İlk kurulum (bir kez, elle):** repo → Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
- **Private repo notu:** Pages'in private repoda çalışması ücretli plan (Pro/Team/Enterprise) gerektirir. Ücretsiz planda repo public olmalıdır.
- Proje alt yolda (`/helios-frame/`) yayınlandığı için varsayılan `hash` router modu sorunsuz çalışır. `history` modunda `404.html` (index.html kopyası) derin bağlantıları uygulamaya düşürür, ancak yeniden yükleme sırasında kısa süreli 404 durum kodu döner; kritikse `hash` modunda kalın.
- Özel alan adı: repo köküne `CNAME` dosyası ekleyip Settings → Pages'ten alan adını girin.

## Klasör yapısı

```
helios-frame/
├─ index.html                 Tek giriş noktası (<script type="module">)
├─ .htaccess                  Apache: MIME, history-mode fallback, gzip, önbellek
├─ assets/css/helios.css      Marka katmanı (hf- önekli sınıflar, Bootstrap override)
├─ data/                      Mock veri (products, customers, quotes, stats)
├─ vendor/                    Yerel dosyalar için (şimdilik boş: JS kütüphanesi yok)
├─ tests/smoke.mjs            jsdom duman testi
└─ src/
   ├─ main.js                 Açılış: UI çatısını yükle -> boot()
   ├─ app.js                  ctx (store, bus, services, router...) kurulumu + auth guard
   ├─ config.js               Tüm ayarlar (router modu, UI, libMode, API, mock)
   ├─ libs.js                 Kütüphane kayıt defteri (yalnızca UI CSS)
   ├─ routes.js               Rota ve layout tanımları (tembel yükleme)
   ├─ core/                   ÇATI ÇEKİRDEĞİ (uygulamadan bağımsız)
   │  ├─ component.js         Component taban sınıfı + yaşam döngüsü
   │  ├─ layout.js            Layout (kalıcı kabuk)
   │  ├─ router.js            Hash / History router, guard, tembel yükleme
   │  ├─ store.js             localStorage destekli durum yöneticisi
   │  ├─ http.js              fetch tabanlı REST istemcisi + interceptor
   │  ├─ loader.js            CDN/yerel script-stil yükleyici
   │  ├─ forms.js             Doğrulama yardımcıları
   │  ├─ dom.js               html`` (otomatik escape), debounce, format
   │  └─ events.js            Event bus
   ├─ services/               REST servis katmanı (mock <-> gerçek API)
   ├─ store/                  Uygulama durumu + sepet eylemleri
   ├─ layouts/                default, shop, b2b, blank
   ├─ components/             ProductCard, DataTable, LineChart/DonutChart, ShopHeader, B2BSidebar
   ├─ ui/                     toast, formField
   └─ pages/                  home, shop/*, b2b/*, not-found
```

`core/` çatıdır, geri kalanı sizin uygulamanızdır. Yeni bir proje için `core/`'u olduğu gibi alıp `pages/`, `routes.js`, `services/` ve `layouts/`'u değiştirmeniz yeterlidir.

## Router

```js
// src/routes.js
{ path: '/shop/:slug', component: () => import('./pages/shop/detail.page.js'), layout: 'shop', meta: { title: 'Ürün', auth: false } }
```

- `component`: sınıf ya da `() => import(...)` (yalnızca ziyaret edilince indirilir).
- `:param`, sondaki `*` (joker), `redirect`, `meta` desteklenir. Sıra önemlidir (özel yollar parametreli olanlardan önce).
- Guard: `router.beforeEach((to, from) => true | false | '/yonlendir')` (bkz. `app.js`).
- Sayfa içinde: `this.props.params`, `this.props.query`, `this.ctx.router.navigate('/yol')`, `this.href('/yol')`, `router.setQuery({...})` (sayfayı yeniden yüklemeden URL filtresi).
- Mod: `config.router.mode = 'hash'` (varsayılan) ya da `'history'` (temiz URL; `.htaccess` kuralı hazır, alt klasörde `RewriteBase`'i düzenleyin).

## Component yaşam döngüsü

```js
import { Component } from '../core/component.js';
import { html } from '../core/dom.js';

export default class ExamplePage extends Component {
  static libs = [{ global: 'Chart', js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js'] }];  // ilk mount'tan önce, yalnızca bu sayfada yüklenir
  state = { loading: true, items: [] };

  beforeMount() {                       // host DOM'da, içerik yok: olay/abonelik kur
    this.on('click', '[data-add]', (e, el) => { /* delege olay, otomatik temizlenir */ });
    this.watch(this.ctx.store, (s) => s.cart, () => this.update());
  }
  async afterMount() {                  // yalnızca ilk render sonrası: veri yükle
    const items = await this.ctx.services.products.list({ signal: this.signal });
    this.setState({ items, loading: false });   // -> shouldUpdate -> render -> afterRender
  }
  render() { return html`<ul>${this.state.items.map((i) => html`<li>${i.name}</li>`)}</ul>`; }
  afterRender() { /* alt bileşen / 3. parti widget: this.mountChild(Cls, '[data-slot]', props) */ }
  beforeUnmount() { /* 3. parti örnekleri destroy et */ }
}
```

Sıra: `constructor → libs → beforeMount → render → afterRender → afterMount`; güncelleme: `setState → shouldUpdate → render → afterRender`; yok etme: `destroy → beforeUnmount → iptal sinyali + alt bileşenler + dinleyiciler/abonelikler temizlenir`.

- `html\`\`` içindeki her değer **otomatik escape** edilir (XSS koruması). `render()` düz string dönerse HTML sayılır; kullanıcı verisi için daima `html\`\`` kullanın.
- Yazarken odak (`id` / `data-key` / `name`) render sonrası geri yüklenir.
- `this.signal` bileşen yok olunca iptal olur: `http.get(url, { signal })` ile yarım kalan istekler temizlenir.
- **Layout kuralı:** Layout kendi içinde `setState` çağırmaz (outlet silinir). Dinamik parçalar alt bileşen olmalıdır (`ShopHeader` örneği).

## Harici JS kütüphaneleri

**Projede şu an hiçbir JavaScript kütüphanesi yoktur.** Tablo (`DataTable`) ve grafikler (`LineChart`, `DonutChart`) kütüphanesiz yazılmıştır; yalnızca UI çatısının Bootstrap **CSS** dosyası yüklenir.

Gerektiğinde Next.js'teki gibi, ihtiyaç duyulan yerde açıkça referans verilir:

| Next.js'te | Helios Frame'de |
|---|---|
| `<Script src="..." strategy="lazyOnload" />` | Sayfa/bileşende `static libs = [{ global, js: [...] }]` |
| `_app` / `_document` içinde genel script | `config.js` → `globalLibs` veya `index.html`'e `<script defer src>` |
| `import x from 'paket'` | `import x from 'https://cdn.jsdelivr.net/npm/paket@1/+esm'` veya `import x from '../../vendor/x.js'` |

```js
export default class RaporPage extends Component {
  static libs = [{ global: 'Chart', js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js'] }];
  afterMount() { this.chart = new window.Chart(this.$('canvas'), { /* ... */ }); }
  beforeUnmount() { this.chart?.destroy(); }
}

// ya da koddan, istediğiniz an:
await this.ctx.loader.load({ global: 'flatpickr', css: ['...'], js: ['...'] });
```

- Tanım alanları: `js`, `css`, `global`, `deps` (önce yüklenecekler), `name`.
- Her kütüphane **bir kez** yüklenir; `global` sayfada zaten varsa **tekrar yüklenmez** (sürüm çakışması olmaz).
- Çok yerde kullanılacaksa `src/libs.js` kayıt defterine ad vererek ekleyin ve `static libs = ['ad']` ile çağırın (`cdn` / `local` yolları `libMode` ile seçilir).
- Ayrıntılı örnekler için `docs/index.html` bölüm 9.
- UI çatısı: `config.ui = 'bootstrap' | 'tailwind' | 'none'` (yalnızca CSS). Örnek sayfalar Bootstrap sınıfları kullanır; çekirdek UI'dan bağımsızdır.

## Durum yönetimi

```js
store.set({ user })                                 // kısmi güncelleme (immutable)
store.set((s) => ({ cart: { ...s.cart, items } }))  // fonksiyonla
store.subscribe(fn, (s) => s.cart.items.length)     // yalnızca seçilen değer değişince çağrılır
```

`persistKeys` (bkz. `app.js`) ile belirtilen anahtarlar `localStorage`'a yazılır, sekmeler arası `storage` olayıyla senkron kalır; `version` değişirse eski veri atılır. Bileşenlerde `this.watch(store, selector, handler)` aboneliği otomatik iptal eder.

## API / servis katmanı

`config.api.mock = true` iken servisler `data/*.json` + `localStorage` ile çalışır. Gerçek backend'e geçmek için `mock: false` ve `baseURL` ayarlayın; arayüz koduna dokunmanız gerekmez. Beklenen REST sözleşmeleri her servis dosyasının başında yazılıdır:

| Servis | Uç noktalar |
|---|---|
| products | `GET /products?q&category&sort&page&perPage` → `{items,total}` · `GET /products/categories` · `GET /products/:slug` |
| orders | `POST /orders` · `GET /orders/:id` |
| auth | `POST /auth/login` → `{token,user}` |
| customers | `GET /customers` · `GET /customers/:id` |
| quotes | `GET /quotes` · `POST /quotes` |
| reports | `GET /reports/dashboard` |

`HttpClient`: baseURL, zaman aşımı, `AbortSignal`, JSON, `useRequest/useResponse/useError` interceptor'ları. Token otomatik eklenir, `401` oturumu kapatıp `/login`'e yönlendirir (`services/index.js`).

## Örnek modüller

- **E-ticaret:** ürün listesi (arama + debounce, kategori, sıralama, sayfalama, URL senkronu), ürün detay, sepet (kalıcı), 3 adımlı ödeme, sipariş sayfası.
- **B2B:** giriş + guard, dashboard (SVG grafikler), müşteri tablosu (arama, sıralama, sayfalama, satır eylemleri), teklif formu (dinamik kalemler, canlı KDV toplamı, doğrulama), teklif listesi.

## Güvenlik notları

- Mock giriş yalnızca demodur. Gerçek projede yetkilendirme **sunucuda** yapılmalıdır; istemci tarafı guard yalnızca arayüz akışıdır.
- Kart verisi istemcide işlenmez/saklanmaz; ödeme sağlayıcısı entegrasyon noktası `services/orders.service.js` içinde belirtilmiştir.
- `DataTable` hücreleri `html` şablon etiketiyle basılır ve metin otomatik escape edilir. Harici bir tablo kütüphanesi eklerseniz onun `render` çıktısı ham HTML olabilir: kullanıcı verisini `escapeHtml()` ile geçirin.
- Canlıda bir CSP (Content-Security-Policy) tanımlamanız önerilir; CDN kullanıyorsanız ilgili alan adlarını izin listesine ekleyin.

## Yol haritası

- Dosya tabanlı rota üretimi (Next.js tarzı `pages/` taraması için isteğe bağlı küçük script, canlıda yine statik)
- Render optimizasyonu: DOM diff (morph) ile kısmi güncelleme
- i18n modülü, tema (açık/koyu) ve erişilebilirlik denetimleri
- Gerçek API için örnek PHP/Node arka uç şablonları
