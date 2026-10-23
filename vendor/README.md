# vendor/ (yerel kütüphane modu)

`src/config.js` içinde `libMode: 'local'` yaptığınızda kütüphaneler CDN yerine buradan okunur.
Dosya yolları `src/libs.js` içindeki `local` bölümlerinde tanımlıdır. Beklenen yapı:

```
vendor/
  bootstrap/   bootstrap.min.css, bootstrap.bundle.min.js
  jquery/      jquery.min.js
  datatables/  dataTables.min.js, dataTables.bootstrap5.min.js, dataTables.bootstrap5.min.css
  chartjs/     chart.umd.js
  tailwind/    tailwind.css   (Tailwind CLI ile üretilmiş statik çıktı)
```

Dosyaları ilgili paketlerin dağıtım klasöründen (npm paketinin `dist/` dizini) kopyalayın.
Yeni bir kütüphane eklemek için `src/libs.js` kaydına `cdn` ve `local` yollarını yazmanız yeterlidir.
