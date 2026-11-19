# Helios Frame 2.0

**Helios Diji** için B2B, CRM ve e-ticaret projelerinde ortak kullanılan, derleme adımı ve zorunlu kütüphane gerektirmeyen arayüz altyapısı. HTML5, modern JavaScript (ES modülleri) ve CSS3 ile yazıldı; paylaşımlı hostinge (GoDaddy cPanel veya Plesk/IIS) dosyaları kopyalamak yeterlidir.

> Durum: v2.0.0 · Lisans: [MIT](LICENSE)

## İçindekiler
1. [Hızlı başlangıç](#hızlı-başlangıç)
2. [Klasör yapısı](#klasör-yapısı)
3. [Yeni proje kurulumu](#yeni-proje-kurulumu)
4. [Tema](#tema)
5. [Menü](#menü)
6. [Bileşenler](#bileşenler)
7. [SEO](#seo)
8. [Güvenlik](#güvenlik)
9. [Performans](#performans)
10. [Geliştirme araçları ve test](#geliştirme-araçları-ve-test)
11. [Lisans](#lisans)

## Hızlı başlangıç

```bash
node tools/serve.mjs          # http://localhost:8080 (canlıdaki CSP başlıklarıyla)
# veya herhangi bir statik sunucu: python3 -m http.server 8080
```

| Demo | Adres | Gösterdiği |
|---|---|---|
| Vitrin | `/` | Tema stüdyosu, tüm bileşenler, yatay menü |
| B2B / CRM panel | `/demo/panel/` | Dikey menü, rol filtresi, tablo, grafik, kanban, teklif formu (SPA) |
| Mağaza | `/demo/shop/` | Yatay + mega menü, filtre, sepet, statik ürün sayfaları (SEO) |
| Ödeme | `/demo/shop/odeme.html` | Doğrulama (TCKN, telefon), maskeler, sepet özeti |

**Canlıya alma:** Repodaki çalışma zamanı dosyalarını (`index.html`, `404.html`, `robots.txt`, `sitemap.xml`, `assets/`, `components/`, `config/`, `core/`, `data/`, `demo/`, `theme/` ve sunucuya göre `.htaccess` **veya** `web.config`) sitenin kök klasörüne yükleyin. `tests/`, `tools/` ve `package.json` sunucuya gerekmez; yüklenirse de sunucu ayarları bunları dışarıya kapatır.

## Klasör yapısı

```
helios-frame/
├─ core/                 Çekirdek (DOM'dan bağımsız kısımlar Node'da da çalışır)
│  ├─ app.js             Başlatıcı: config → tema → dil → kullanıcı → bileşenler
│  ├─ dom.js             Güvenli şablon motoru html``, render(), Trusted Types
│  ├─ config.js          project.config.json yükleme, url() yol çözücü
│  ├─ theme.js           Dinamik tema (CSS değişkenleri, kontrast, koyu mod)
│  ├─ theme-boot.js      İlk boyamadan önce tema (renk sıçraması olmaz)
│  ├─ store.js           Proxy tabanlı reaktif durum + kalıcılık
│  ├─ http.js            fetch istemcisi (timeout, retry, CSRF)
│  ├─ router.js          SPA yönlendirici (panel alanları için)
│  ├─ validate.js        Form doğrulama, TCKN/VKN/IBAN/telefon, maskeler
│  ├─ seo.js             Meta, JSON-LD (Product, Breadcrumb, Organization…)
│  ├─ i18n.js            Çoklu dil, çoğul kuralları
│  └─ format.js          Para, tarih, göreli zaman (Intl), slug
├─ components/           hd-* Web Components ve şablonlar
├─ theme/                tokens.css · base.css · layout.css · components.css · utilities.css · fonts/
├─ config/               project.config.json · menu.json   ← projeye özel tek yer
├─ assets/               icons.svg (sprite), img/
├─ data/                 Demo JSON verileri
├─ demo/                 Vitrin, panel ve mağaza örnekleri
├─ tools/                serve.mjs · prerender-shop.mjs · headers.mjs (yalnızca geliştirme)
├─ tests/                node --test (bağımlılık yok)
├─ .htaccess · web.config  Apache / IIS: güvenlik başlıkları, önbellek, sıkıştırma
└─ 404.html · robots.txt · sitemap.xml
```

## Yeni proje kurulumu

1. Bu repoyu projeye ekleyin. Önerilen yöntem, sürüm etiketine sabitlenmiş bir submodule:
   ```bash
   git submodule add https://github.com/daralanda/helios-frame wwwroot/lib/helios-frame
   cd wwwroot/lib/helios-frame && git checkout v2.0.0
   ```
2. Projeye özel yalnızca iki dosya düzenlenir: `config/project.config.json` ve `config/menu.json`. Farklı bir dosya kullanmak için sayfaya `<meta name="hf-config" content="config/bayi.json">` ekleyin.
3. Sayfa şablonu:
   ```html
   <link rel="stylesheet" href="theme/tokens.css"> <!-- + base, layout, components, utilities -->
   <script src="core/theme-boot.js"></script>
   <script type="module" src="core/app.js"></script>
   ...
   <hd-shell nav="vertical" menu="panel" search>
     <h1>Sayfa içeriği</h1>
   </hd-shell>
   ```
4. Sayfaya özel kod:
   ```js
   import { ready } from './core/app.js';
   const app = await ready; // { config, t, fmt, store, bus, http, data, user, can(), url() }
   ```

## Tema

Tüm görünüm `project.config.json → theme` ile yönetilir; değerler CSS değişkenlerine dönüşür.

```json
"theme": {
  "mode": "auto",
  "density": "comfortable",
  "colors": { "brand": "#f47b20", "accent": "#383e42" },
  "radius": "10px",
  "font": null,
  "components": { "card": { "radius": "14px", "shadow": "none" }, "button": { "radius": "10px" } }
}
```

- Tek `brand` renginden hover, aktif, yumuşak zemin ve AA kontrastlı metin tonları **OKLCH** ile türetilir. Butondaki yazı rengi (beyaz/koyu) kontrasta göre otomatik seçilir.
- `components.<ad>.<özellik>` → `--hf-<ad>-<özellik>` (ör. `--hf-card-radius`). Değerler doğrulanır; `url()`, `;`, `{}` içeren girdiler reddedilir.
- `mode`: `light | dark | auto`. Kullanıcı seçimi tarayıcıda saklanır.
- `density: compact`: B2B tabloları için sık yerleşim.
- Varsayılan font **Inter** (değişken font, Türkçe karakterler dahil). Sunucuda barındırılır, Google'a istek gitmez.
- Canlı deneme için vitrindeki **Tema stüdyosu**nu kullanın; çıkan JSON doğrudan config'e yapıştırılır.
- CSS `@layer reset, tokens, base, layout, components, utilities, project` sırasıyla yüklenir. Projeye özel stilleri `@layer project { … }` içine yazın; Bootstrap gibi bir kütüphaneyle birlikte kullanılsa da çakışma olmaz.

## Menü

Tüm menüler `config/menu.json` içindedir. Aynı menü dikey (kenar) veya yatay (üst) olarak çizilebilir.

```json
{ "menus": { "panel": [
  { "group": "Satış", "items": [
    { "label": "Müşteriler", "href": "demo/panel/#/musteriler", "icon": "users", "badge": 4 },
    { "label": "Teklifler", "icon": "file", "children": [ { "label": "Yeni", "href": "demo/panel/#/teklifler/yeni" } ] },
    { "label": "Raporlar", "href": "…", "roles": ["admin"] }
  ]}
]}}
```

| Öznitelik | Açıklama |
|---|---|
| `<hd-shell nav="vertical\|horizontal\|both">` | Yerleşim (verilmezse `layout.nav`) |
| `menu="panel"` / `top-menu="main"` | Kenar ve üst menü adları (`both` modunda ikisi farklı olabilir) |
| `search`, `cart` | Üst çubukta arama ve sepet |
| `label` | Metin veya `{ "tr": "…", "en": "…" }` |
| `roles` | Öğe veya grup yalnızca bu rollere görünür |
| `mega: true`, `desc` | Yatay menüde mega menü ve açıklama |

Aktif sayfa, açık alt menüler ve breadcrumb adrese göre otomatik hesaplanır. Mobilde menü erişilebilir bir çekmeceye dönüşür (Esc, odak yönetimi, `inert`). Kenar menü daraltılabilir ve tercih saklanır.

> Rol filtresi yalnızca arayüz içindir. Yetki kontrolü **her zaman sunucuda** yapılmalıdır.

## Bileşenler

| Bileşen | Kullanım |
|---|---|
| `hd-shell` | Uygulama kabuğu (kenar menü, üst çubuk, çekmece, alt bilgi) |
| `hd-menu`, `hd-breadcrumb` | Config'den menü ve konum |
| `hd-table` | `src` veya `.data`; sıralama, Türkçe arama, sayfalama; dar alanda karta dönüşür; `hd-row` olayı |
| `hd-chart` | `type="line\|bar"`; kütüphanesiz SVG, temaya uyumlu |
| `hd-tabs` | İçerik HTML'de kalır (SEO), ARIA ve klavye desteği |
| `hd-qty`, `hd-cart-button` | Adet seçici, sepet ve çekmece |
| `toast()`, `confirmDialog()` | `components/overlay.js` |
| `data-dialog-open="#id"`, `popovertarget` | JS yazmadan diyalog ve açılır menü |
| `<form data-hf-validate>` | `data-rule="email\|phone\|iban\|tckn\|vkn"`, `data-mask="phone\|iban\|digits"` |

CSS sınıfları `hf-` önekiyle gelir: `hf-btn(--primary|--soft|--ghost|--danger)`, `hf-card`, `hf-stat`, `hf-badge`, `hf-alert`, `hf-input`, `hf-select`, `hf-switch`, `hf-dialog(--drawer)`, `hf-kanban`, `hf-timeline`, `hf-steps`, `hf-grid`, `hf-stack`, `hf-cluster`, `hf-split` vb. Bütün örnekler vitrin sayfasındadır.

## SEO

- **Vitrin ve ürün sayfaları gerçek HTML'dir.** İçerik JS beklemeden okunur. `tools/prerender-shop.mjs` aynı kart şablonuyla (`components/templates.js`) liste ve ürün sayfalarını, `sitemap.xml` ve `robots.txt` dosyalarını üretir.
- Her sayfada `title`, `description`, `canonical`, Open Graph ve Twitter etiketleri bulunur. Ürünlerde `Product` + `Offer` + `AggregateRating` ve `BreadcrumbList` JSON-LD verisi vardır.
- Menüdeki tüm bağlantılar gerçek `<a href>` olduğu için botlar tarafından takip edilir. Filtre parametreleri canonical ile tekilleştirilir.
- Panel ve ödeme sayfaları `noindex`; `robots.txt` panel klasörünü kapatır.
- Core Web Vitals: tüm görsellerde `width/height`, ilk görsellerde `fetchpriority="high"`, diğerlerinde `loading="lazy"`, font `preload` + `font-display: swap`. JS gelmeden kabuğun yeri ayrılır (yerel ölçümde CLS 0).
- `config.seo.siteUrl` canlı alan adıyla güncellenmelidir; prerender mutlak adresleri buradan üretir.

## Güvenlik

- **XSS:** DOM'a HTML yalnızca `render()` ile yazılır ve yalnızca `html``…`` şablonu kabul edilir. Tüm değerler escape edilir; `href`/`src` içindeki `javascript:`/`data:` adresleri etkisizleştirilir. Trusted Types politikası (`helios`) tek yetkili kaynaktır.
- **CSP:** `script-src 'self'`, `style-src 'self'`; satır içi script, stil veya olay özniteliği yoktur. Testler bunu her commit'te denetler.
- **Başlıklar:** CSP, HSTS, nosniff, Referrer-Policy, Permissions-Policy, COOP, `frame-ancestors 'none'`. Tek kaynak `tools/headers.mjs`; `.htaccess` ve `web.config` ile aynı olduğu testle doğrulanır.
- **CSRF:** `http.js`, token'ı (`meta[name=csrf-token]` veya `XSRF-TOKEN` çerezi) yalnızca **aynı origin'e** giden yazma isteklerine ekler. ASP.NET Core'da `AddAntiforgery(o => o.HeaderName = "X-XSRF-TOKEN")` ile eşleşir.
- **Oturum:** Token'lar localStorage'a yazılmaz; HttpOnly + Secure + SameSite çerez kullanılmalıdır. localStorage'da yalnızca tema, menü tercihi ve sepet tutulur.
- **Ödeme (PCI-DSS):** Kart bilgisi sitede alınmaz; bankanın 3D Secure sanal POS sayfasına yönlendirilir. Sepetteki fiyatlar yalnızca gösterim içindir; sunucu fiyatı ürün kimliğinden yeniden hesaplar.
- **Diğer:** prototype pollution korumalı config birleştirme, CSV dışa aktarmada formül enjeksiyonu koruması, geliştirme klasörlerinin sunucuda kapatılması, harici CDN olmaması.

## Performans

- Zorunlu bağımlılık yok, derleme yok. Çekirdek ve bileşenler yorumlarla birlikte ~42 KB (gzip). Router yalnızca panelde, sayfa modülleri ihtiyaç anında yüklenir.
- CSS ~13 KB (gzip). `content-visibility` ile ekran dışı bölümler geç işlenir; `@view-transition` ile sayfa geçişleri yumuşar.
- Tema ve marka renkleri ilk boyamadan önce uygulanır, renk sıçraması olmaz.
- Önbellek: font 1 yıl, görseller 30 gün, JS/CSS 1 saat; HTML ve JSON her istekte doğrulanır.

## Geliştirme araçları ve test

Node.js yalnızca geliştirme için gerekir (sürüm 20 veya üstü) ve `npm install` gerekmez.

```bash
npm test              # birim + güvenlik + SEO denetimleri (node --test)
npm run serve         # yerel sunucu, canlıdaki güvenlik başlıklarıyla
npm run prerender     # data/products.json → mağaza HTML, sitemap.xml, robots.txt
```

GitHub Actions (`.github/workflows/pages.yml`) her push ve PR'da testleri çalıştırır ve üretilen mağaza sayfalarının güncel olup olmadığını kontrol eder. `main` dalı GitHub Pages'e yayınlanır (private repoda ücretli plan gerekir).

## Lisans

Helios Frame [MIT lisansı](LICENSE) ile dağıtılır. © 2026 Helios Diji.

Projede kullanılan Inter yazı tipi [SIL Open Font License 1.1](theme/fonts/OFL-Inter.txt) ile lisanslıdır. Demo görselleri, ikonlar ve logo projeye özgüdür.
