/**
 * Harici kütüphane kaydı (registry).
 *
 * Yeni bir kütüphane eklemek için buraya bir kayıt yazın, sonra:
 *   - Sayfa/bileşen içinde:  static libs = ['chartjs'];   (ilk mount'tan önce yüklenir)
 *   - veya koddan:           await ctx.loader.load('chartjs');
 *
 * Kurallar:
 *  - Her kütüphane en fazla bir kez yüklenir (aynı Promise paylaşılır).
 *  - `deps` sırayla önce yüklenir (örn. DataTables -> jQuery).
 *  - `global` sayfada zaten varsa (örn. kendi <script> etiketinizle jQuery eklediyseniz)
 *    tekrar yüklenmez -> sürüm çakışması olmaz.
 *  - `libMode: 'local'` iken dosyalar vendor/ klasöründen okunur.
 */
import { config } from './config.js';
import { LibraryLoader } from './core/loader.js';

const DT = 'https://cdn.datatables.net/2.1.8';

export const registry = {
  bootstrap: {
    global: 'bootstrap',
    cdn: {
      css: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css'],
      js: ['https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'],
    },
    local: {
      css: ['vendor/bootstrap/bootstrap.min.css'],
      js: ['vendor/bootstrap/bootstrap.bundle.min.js'],
    },
  },

  // Tailwind Play CDN yalnızca geliştirme içindir. Canlıda Tailwind CLI ile
  // üretilmiş statik CSS'i vendor/tailwind/tailwind.css olarak kullanın (libMode: 'local').
  tailwind: {
    global: 'tailwind',
    cdn: { js: ['https://cdn.tailwindcss.com'] },
    local: { css: ['vendor/tailwind/tailwind.css'] },
  },

  jquery: {
    global: 'jQuery',
    cdn: { js: ['https://code.jquery.com/jquery-3.7.1.min.js'] },
    local: { js: ['vendor/jquery/jquery.min.js'] },
  },

  datatables: {
    global: 'DataTable',
    deps: ['jquery'],
    cdn: {
      css: [`${DT}/css/dataTables.bootstrap5.min.css`],
      js: [`${DT}/js/dataTables.min.js`, `${DT}/js/dataTables.bootstrap5.min.js`],
    },
    local: {
      css: ['vendor/datatables/dataTables.bootstrap5.min.css'],
      js: ['vendor/datatables/dataTables.min.js', 'vendor/datatables/dataTables.bootstrap5.min.js'],
    },
  },

  chartjs: {
    global: 'Chart',
    cdn: { js: ['https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.js'] },
    local: { js: ['vendor/chartjs/chart.umd.js'] },
  },
};

export const loader = new LibraryLoader(registry, config.libMode);
