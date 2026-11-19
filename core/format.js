/**
 * Helios Frame · Biçimlendirme (Intl API, kütüphanesiz).
 *   fmt.money(1499.9)        -> "₺1.499,90"
 *   fmt.date('2026-11-19')   -> "19 Kas 2026"
 *   fmt.relative(date)       -> "3 gün önce"
 */
export function createFormat({ locale = 'tr-TR', currency = 'TRY', timezone } = {}) {
  const cache = new Map();
  const nf = (opts) => {
    const k = JSON.stringify(opts);
    if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(locale, opts));
    return cache.get(k);
  };
  const toDate = (v) => (v instanceof Date ? v : new Date(v));
  const valid = (d) => !Number.isNaN(d.getTime());
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const UNITS = [['year', 31536e6], ['month', 2592e6], ['week', 6048e5], ['day', 864e5], ['hour', 36e5], ['minute', 6e4], ['second', 1e3]];

  return {
    number: (v, opts = {}) => nf(opts).format(Number(v) || 0),
    money: (v, cur = currency) => nf({ style: 'currency', currency: cur }).format(Number(v) || 0),
    percent: (v, digits = 1) => nf({ style: 'percent', maximumFractionDigits: digits }).format(Number(v) || 0),
    compact: (v) => nf({ notation: 'compact', maximumFractionDigits: 1 }).format(Number(v) || 0),
    date(v, style = 'medium') {
      const d = toDate(v);
      return valid(d) ? new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: timezone }).format(d) : '';
    },
    datetime(v) {
      const d = toDate(v);
      return valid(d) ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(d) : '';
    },
    relative(v, now = Date.now()) {
      const d = toDate(v);
      if (!valid(d)) return '';
      const diff = d.getTime() - now;
      for (const [unit, ms] of UNITS) {
        if (Math.abs(diff) >= ms || unit === 'second') return rtf.format(Math.round(diff / ms), unit);
      }
      return '';
    },
  };
}

/** Türkçe karakterleri dönüştüren SEO dostu slug: "Endüstriyel Sensör" -> "endustriyel-sensor" */
export function slugify(text) {
  const map = { ç: 'c', ğ: 'g', ı: 'i', i: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
  return String(text ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıiöşüâîû]/g, (c) => map[c] ?? c)
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
