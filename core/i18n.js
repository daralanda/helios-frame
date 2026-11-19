/**
 * Helios Frame · Çoklu dil.
 *   const { t, label } = createI18n({ locale: 'tr-TR', messages: { tr: { 'cart.add': 'Sepete ekle' } } });
 *   t('cart.items', { n: 3 })   // "3 ürün" (çoğul kuralı: { one: '...', other: '...' })
 *   label({ tr: 'Ürünler', en: 'Products' })  // menüdeki çok dilli etiketler
 */

export const BUILTIN = {
  tr: {
    'nav.toggle': 'Menüyü aç/kapat',
    'nav.collapse': 'Kenar menüyü daralt',
    'nav.main': 'Ana menü',
    'nav.breadcrumb': 'Konum',
    'theme.toggle': 'Koyu/açık tema',
    'search.placeholder': 'Ara…',
    'table.search': 'Tabloda ara…',
    'table.empty': 'Kayıt bulunamadı',
    'table.range': '{from}–{to} / {total} kayıt',
    'table.prev': 'Önceki sayfa',
    'table.next': 'Sonraki sayfa',
    'table.perPage': 'Sayfa başına',
    'dialog.close': 'Kapat',
    'dialog.ok': 'Tamam',
    'dialog.cancel': 'Vazgeç',
    'cart.title': 'Sepetim',
    'cart.add': 'Sepete ekle',
    'cart.added': '{name} sepete eklendi',
    'cart.empty': 'Sepetiniz boş',
    'cart.total': 'Toplam',
    'cart.checkout': 'Siparişi tamamla',
    'cart.remove': 'Kaldır',
    'cart.items': { one: '{n} ürün', other: '{n} ürün' },
    'form.required': 'Bu alan zorunludur',
    'form.email': 'Geçerli bir e-posta adresi girin',
    'form.phone': 'Geçerli bir telefon numarası girin (05xx xxx xx xx)',
    'form.iban': 'Geçerli bir TR IBAN girin',
    'form.tckn': 'Geçerli bir T.C. kimlik numarası girin',
    'form.vkn': 'Geçerli bir vergi numarası girin',
    'form.min': 'En az {min} karakter olmalı',
    'form.max': 'En fazla {max} karakter olmalı',
    'form.minValue': 'En az {min} olmalı',
    'form.maxValue': 'En fazla {max} olmalı',
    'form.pattern': 'Biçim geçersiz',
    'form.match': 'Alanlar eşleşmiyor',
    'form.invalid': 'Lütfen işaretli alanları düzeltin',
    'qty.dec': 'Azalt',
    'qty.inc': 'Artır',
  },
  en: {
    'nav.toggle': 'Toggle menu',
    'nav.collapse': 'Collapse sidebar',
    'nav.main': 'Main menu',
    'nav.breadcrumb': 'Breadcrumb',
    'theme.toggle': 'Toggle dark mode',
    'search.placeholder': 'Search…',
    'table.search': 'Search table…',
    'table.empty': 'No records found',
    'table.range': '{from}–{to} of {total}',
    'table.prev': 'Previous page',
    'table.next': 'Next page',
    'table.perPage': 'Per page',
    'dialog.close': 'Close',
    'dialog.ok': 'OK',
    'dialog.cancel': 'Cancel',
    'cart.title': 'My cart',
    'cart.add': 'Add to cart',
    'cart.added': '{name} added to cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.remove': 'Remove',
    'cart.items': { one: '{n} item', other: '{n} items' },
    'form.required': 'This field is required',
    'form.email': 'Enter a valid email address',
    'form.invalid': 'Please fix the highlighted fields',
  },
};

export function createI18n({ locale = 'tr-TR', fallback = 'tr', messages = {} } = {}) {
  const lang = locale.split('-')[0];
  const dict = (l) => ({ ...(BUILTIN[l] ?? {}), ...(messages[l] ?? {}) });
  const primary = dict(lang);
  const backup = dict(fallback);
  const plural = new Intl.PluralRules(locale);

  function t(key, params = {}) {
    let msg = primary[key] ?? backup[key] ?? key;
    if (msg && typeof msg === 'object') msg = msg[plural.select(Number(params.n ?? 0))] ?? msg.other ?? key;
    return String(msg).replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
  }

  /** Menü/config etiketi: "Metin" veya { tr: '...', en: '...' } */
  function label(value) {
    if (value == null) return '';
    if (typeof value === 'object') return value[lang] ?? value[fallback] ?? Object.values(value)[0] ?? '';
    return String(value);
  }

  return { t, label, lang, locale };
}
