/**
 * Uygulama ayarları. Ortama göre (geliştirme / canlı) burayı düzenleyin.
 * Statik hosting'de derleme adımı olmadığı için tüm ayarlar çalışma zamanında okunur.
 */
const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);

export const config = {
  appName: 'Helios Frame',
  brand: 'Helios Diji',
  version: '0.1.0',

  router: {
    // 'hash'    -> /#/shop     (sunucu ayarı gerektirmez, GoDaddy'de doğrudan çalışır)
    // 'history' -> /shop       (temiz URL; .htaccess içindeki rewrite kuralı gerekir)
    mode: 'hash',
  },

  // 'bootstrap' | 'tailwind' | 'none'
  ui: 'bootstrap',
  // 'cdn'   -> kütüphaneler CDN'den
  // 'local' -> kütüphaneler vendor/ klasöründen (offline / KVKK / hız için)
  libMode: 'cdn',

  // Tüm sitede, uygulama açılmadan önce yüklenecek JS kütüphaneleri (Next.js'teki _app/_document gibi).
  // Örn: [{ global: 'dayjs', js: ['https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js'] }]
  // Yalnızca belirli sayfada gerekenleri burada değil, o sayfanın `static libs` alanında referans verin.
  globalLibs: [],

  api: {
    baseURL: '/api',      // gerçek REST API adresi (mock: false iken kullanılır)
    mock: true,           // true: data/*.json + localStorage ile çalışır (backend gerekmez)
    mockDelay: 150,       // mock yanıt gecikmesi (ms) - gerçekçi yükleme durumları için
    timeout: 15000,
  },

  storage: { prefix: 'hf:' },

  shop: {
    currency: 'TRY',
    freeShippingThreshold: 1500,
    shippingFee: 59.9,
    expressFee: 99,
  },

  b2b: { vatRate: 0.2 },

  debug: isLocal,
};
