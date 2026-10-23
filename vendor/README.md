# vendor/

Şimdilik **boş**: projeye dahil hiçbir JS kütüphanesi yoktur.

Bir kütüphaneyi kendi sunucunuzdan servis etmek istediğinizde dosyayı buraya koyun ve referans verin:

```js
// Next.js'te `import x from 'paket'` yazmak gibi, doğrudan ES modülü olarak:
import foo from '../../vendor/foo.js';

// Ya da klasik (UMD) script ise, ihtiyaç duyulan sayfada:
static libs = [{ global: 'Foo', js: ['vendor/foo/foo.min.js'] }];
```

`libMode: 'local'` ayarı yalnızca `src/libs.js` kayıt defterindeki `local` yollarını seçer
(şu an yalnızca Bootstrap CSS: `vendor/bootstrap/bootstrap.min.css`).
