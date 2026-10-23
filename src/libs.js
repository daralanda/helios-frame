/**
 * Harici kütüphane kayıt defteri.
 *
 * ŞU AN PROJEYE DAHİL HİÇBİR JS KÜTÜPHANESİ YOKTUR. Burada yalnızca UI çatısının
 * (Bootstrap) CSS dosyası bulunur; JavaScript'i yüklenmez.
 *
 * Next.js'te bir kütüphaneyi nasıl ihtiyaç duyulan yerde referans veriyorsanız burada da öyle yapın:
 *
 *   1) Bileşen/sayfada, <Script src="..."> gibi (önerilen):
 *        static libs = [{ global: 'Chart', js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js'] }];
 *   2) Koddan, istediğiniz an:
 *        await this.ctx.loader.load({ global: 'Chart', js: ['https://...'] });
 *   3) Tüm sitede gerekiyorsa (Next'teki _app / _document gibi): config.js -> globalLibs
 *   4) ES modülü olarak doğrudan import (derleyici gerekmez, tarayıcı URL'den import eder):
 *        import confetti from 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm';
 *        import foo from '../../vendor/foo.js';      // yerel dosya
 *   5) Birden çok yerde kullanılacaksa aşağıdaki kayıt defterine ad vererek ekleyin,
 *        sonra yalnızca adıyla çağırın: static libs = ['chartjs'];
 *
 * Kayıt girdisi biçimi (cdn/local ayrımı libMode ayarına göre seçilir):
 *   chartjs: {
 *     global: 'Chart',                      // varsa tekrar yüklenmez (sürüm çakışması olmaz)
 *     deps: [],                             // önce yüklenecek kütüphaneler
 *     cdn:   { css: [], js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js'] },
 *     local: { css: [], js: ['vendor/chartjs/chart.umd.js'] },
 *   },
 */
import { config } from './config.js';
import { LibraryLoader } from './core/loader.js';

export const registry = {
  // UI çatısı: yalnızca CSS (JS yok). config.js -> ui ile seçilir.
  bootstrap: {
    cdn: { css: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'] },
    local: { css: ['vendor/bootstrap/bootstrap.min.css'] },
  },
  // Tailwind: statik olarak üretilmiş CSS dosyası (Tailwind CLI çıktısı).
  tailwind: {
    cdn: { css: ['vendor/tailwind/tailwind.css'] },
    local: { css: ['vendor/tailwind/tailwind.css'] },
  },
};

export const loader = new LibraryLoader(registry, config.libMode);
