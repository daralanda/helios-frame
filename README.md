# Helios Frame 2.0

**Helios Diji** için B2B, CRM ve e-ticaret projelerinde ortak kullanılan, derleme adımı ve zorunlu kütüphane gerektirmeyen arayüz altyapısı. HTML5, modern JavaScript (ES modülleri) ve CSS3 ile yazıldı; paylaşımlı hostinge (GoDaddy cPanel veya Plesk/IIS) dosyaları kopyalamak yeterlidir.

> Durum: v2.0.0 · Lisans: [MIT](LICENSE)

## İçindekiler
1. [Hızlı başlangıç](#hızlı-başlangıç)
2. [Klasör yapısı](#klasör-yapısı)
3. [Yeni proje kurulumu](#yeni-proje-kurulumu)
4. [İçerik genişliği](#içerik-genişliği)
5. [Tema](#tema)
6. [Menü](#menü)
7. [Bileşenler](#bileşenler)
8. [SEO](#seo)
9. [Güvenlik](#güvenlik)
10. [Performans](#performans)
11. [Geliştirme araçları ve test](#geliştirme-araçları-ve-test)
12. [Lisans](#lisans)

## Hızlı başlangıç

```bash
node tools/serve.mjs          # http://localhost:8080 (canlıdaki CSP başlıklarıyla)
# veya herhangi bir statik sunucu: python3 -m http.server 8080
```

| Sayfa | Adres | Gösterdiği |
|---|---|---|
| Başlangıç şablonu | `/` | Yeni projenin ilk sayfası (sade) |
| Vitrin | `/examples/` | Tema stüdyosu, tüm bileşenler, yatay menü |
| B2B / CRM panel | `/examples/panel/` | Dikey menü, rol filtresi, tablo, grafik, kanban, teklif formu (SPA) |
| Mağaza | `/examples/shop/` | Yatay + mega menü, filtre, sepet, statik ürün sayfaları (SEO) |
| Ödeme | `/examples/shop/odeme.html` | Doğrulama (TCKN, telefon), maskeler, sepet özeti |

### Çekirdek ve örnekler ayrı

| Klasör | Ne | Canlıda gerekli mi? |
|---|---|---|
| `core/`, `components/`, `theme/`, `assets/` | Framework çekirdeği | **Evet** |
| `config/`, `index.html`, `404.html`, `robots.txt` | Projeye özel başlangıç dosyaları | **Evet** (düzenlenir) |
| `.htaccess` (Linux/cPanel) veya `web.config` (Windows/Plesk) | Sunucu ayarları | **Evet** (hosting türüne göre biri) |
| `examples/` | Vitrin, panel, mağaza örnekleri ve demo verileri | Hayır |
| `tools/`, `tests/`, `package.json`, `.github/` | Geliştirme araçları (Node) | Hayır |

**Sade paket:** `.gitattributes` sayesinde GitHub'ın "Download ZIP" / sürüm arşivleri ve `git archive` yalnızca çekirdeği içerir; `examples/`, `tools/`, `tests/` pakete girmez:

```bash
git archive --format=zip -o helios-frame.zip HEAD   # yalnızca canlıda gereken dosyalar
```

**Canlıya alma:** Sade paketi sitenin kök klasörüne açın. Git ile çekiyorsanız örnekler de gelir; zararsızdır ama istemiyorsanız `examples/` klasörünü sunucudan silebilirsiniz. `tools/` ve `tests/` sunucu ayarlarıyla dışarıya kapalıdır.

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
├─ assets/               icons.svg (sprite), img/ (logo, placeholder)
├─ index.html            Başlangıç şablonu
├─ examples/             Örnekler (canlıda gerekmez)
│  ├─ index.html         Vitrin + tema stüdyosu
│  ├─ panel/ · shop/     B2B/CRM panel, mağaza, ödeme
│  ├─ config/ · data/ · img/   Örneklere ait ayar, veri ve görseller
├─ tools/                serve.mjs · prerender-shop.mjs · headers.mjs (yalnızca geliştirme)
├─ .gitattributes        Sade paket: examples/tools/tests arşive girmez
├─ tests/                node --test (bağımlılık yok)
├─ .htaccess · web.config  Apache / IIS: güvenlik başlıkları, önbellek, sıkıştırma
└─ 404.html · robots.txt
```

## Yeni proje kurulumu

1. Bu repoyu projeye ekleyin. Önerilen yöntem, sürüm etiketine sabitlenmiş bir submodule:
   ```bash
   git submodule add https://github.com/daralanda/helios-frame wwwroot/lib/helios-frame
   cd wwwroot/lib/helios-frame && git checkout v2.0.0
   ```
2. Projeye özel yalnızca iki dosya düzenlenir: `config/project.config.json` ve `config/menu.json`. Dolu bir örnek için `examples/config/` klasörüne bakın. Farklı bir dosya kullanmak için sayfaya `<meta name="hf-config" content="config/bayi.json">` ekleyin.
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

## İçerik genişliği

Varsayılan **tam genişlik**tir (kenarlarda yalnızca küçük bir boşluk kalır). `project.config.json` içinden değiştirilir:

```json
"layout": { "width": "full" }
```

| Değer | Genişlik |
|---|---|
| `full` | Ekranın tamamı (kenar boşluğu hariç) |
| `wide` | 1600px |
| `normal` | 1280px |
| `narrow` | 1024px |
| CSS değeri | `"1440px"`, `"92vw"`, `"90%"` … |

- **Sayfa bazında:** `<hd-shell width="normal">` yalnızca o sayfayı etkiler (ör. ödeme formu dar, liste sayfaları geniş).
- **Kullanıcı bazında:** Panelde **Ayarlar → İçerik genişliği** veya kodda `setWidth('wide')` (`core/theme.js`). Tercih tarayıcıda saklanır ve sayfa açılırken ilk boyamadan önce uygulanır.
- Yatay menülü sayfalarda üst çubuk içeriği, seçilen genişliğe göre sayfa içeriğiyle hizalanır.

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
- Canlı deneme için `/examples/` sayfasındaki **Tema stüdyosu**nu kullanın (genişlik dahil); çıkan JSON doğrudan config'e yapıştırılır.
- CSS `@layer reset, tokens, base, layout, components, utilities, project` sırasıyla yüklenir. Projeye özel stilleri `@layer project { … }` içine yazın; Bootstrap gibi bir kütüphaneyle birlikte kullanılsa da çakışma olmaz.

## Menü

Tüm menüler `config/menu.json` içindedir. Aynı menü dikey (kenar) veya yatay (üst) olarak çizilebilir.

```json
{ "menus": { "panel": [
  { "group": "Satış", "items": [
    { "label": "Müşteriler", "href": "panel/#/musteriler", "icon": "users", "badge": 4 },
    { "label": "Teklifler", "icon": "file", "children": [ { "label": "Yeni", "href": "panel/#/teklifler/yeni" } ] },
    { "label": "Raporlar", "href": "…", "roles": ["admin"] }
  ]}
]}}
```

| Öznitelik | Açıklama |
|---|---|
| `<hd-shell nav="vertical\|horizontal\|both">` | Yerleşim (verilmezse `layout.nav`) |
| `width="normal"` | Sayfaya özel içerik genişliği |
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

CSS sınıfları `hf-` önekiyle gelir: `hf-btn(--primary|--soft|--ghost|--danger)`, `hf-card`, `hf-stat`, `hf-badge`, `hf-alert`, `hf-input`, `hf-select`, `hf-switch`, `hf-dialog(--drawer)`, `hf-kanban`, `hf-timeline`, `hf-steps`, `hf-grid`, `hf-stack`, `hf-cluster`, `hf-split` vb. Bütün örnekler `/examples/` vitrin sayfasındadır.

## SEO

- **Vitrin ve ürün sayfaları gerçek HTML'dir.** İçerik JS beklemeden okunur. `tools/prerender-shop.mjs` aynı kart şablonuyla (`components/templates.js`) örnek mağazanın liste ve ürün sayfalarını, `sitemap.xml` ve `robots.txt` dosyalarını üretir; kendi ürün verinize uyarlanır.
- Her sayfada `title`, `description`, `canonical`, Open Graph ve Twitter etiketleri bulunur. Ürünlerde `Product` + `Offer` + `AggregateRating` ve `BreadcrumbList` JSON-LD verisi vardır.
- Menüdeki tüm bağlantılar gerçek `<a href>` olduğu için botlar tarafından takip edilir. Filtre parametreleri canonical ile tekilleştirilir.
- Panel ve ödeme sayfaları `noindex`; `robots.txt` panel klasörünü kapatır.
- Core Web Vitals: tüm görsellerde `width/height`, ilk görsellerde `fetchpriority="high"`, diğerlerinde `loading="lazy"`, font `preload` + `font-display: swap`. JS gelmeden kabuğun yeri ayrılır (yerel ölçümde CLS 0).
- `config.seo.siteUrl` canlı alan adıyla güncellenmelidir; prerender mutlak adresleri buradan üretir.

## Güvenlik

- **XSS:** DOM'a HTML yalnızca `render()` ile yazılır ve yalnızca `html``…`` şablonu kabul edilir. Tüm değerler escape edilir; `href`/`src` içindeki `javascript:`/`data:` adresleri etkisizleştirilir. Trusted Types politikası (`helios`) tek yetkili kaynaktır.
- **CSP:** `script-src 'self'`, `style-src 'self'`; satır içi script, stil veya olay özniteliği yoktur. Testler bunu her commit'te denetler.
- **HTTPS:** Panel, giriş ve ödeme sayfaları SSL olmadan canlıya alınmamalıdır. Sertifika kurulunca `.htaccess` içindeki HTTPS yönlendirmesini açın (IIS'te Plesk → "Permanent SEO-safe 301 redirect") ve CSP'ye `upgrade-insecure-requests` ekleyin. HSTS başlığı yalnızca HTTPS bağlantıda etkili olur.
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
npm run prerender     # examples/data/products.json → mağaza HTML, sitemap.xml, robots.txt
```

GitHub Actions (`.github/workflows/pages.yml`) her push ve PR'da testleri çalıştırır ve üretilen mağaza sayfalarının güncel olup olmadığını kontrol eder. `main` dalı GitHub Pages'e yayınlanır (private repoda ücretli plan gerekir).

## Lisans

Helios Frame [MIT lisansı](LICENSE) ile dağıtılır. © 2026 Helios Diji.

Projede kullanılan Inter yazı tipi [SIL Open Font License 1.1](theme/fonts/OFL-Inter.txt) ile lisanslıdır. Demo görselleri, ikonlar ve logo projeye özgüdür.
