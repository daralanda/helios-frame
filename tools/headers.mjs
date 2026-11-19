/**
 * Güvenlik başlıkları · TEK KAYNAK. .htaccess ve tools/serve.mjs aynı değerleri kullanır;
 * değiştirirseniz .htaccess dosyasını da güncelleyin (tests/headers.test.mjs farkı yakalar).
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
  "require-trusted-types-for 'script'",
  'trusted-types helios',
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
};

/** Yerel http:// geliştirme için: upgrade-insecure-requests ve HSTS canlıya özeldir. */
export const DEV_HEADERS = {
  ...SECURITY_HEADERS,
  'Content-Security-Policy': CSP.replace('upgrade-insecure-requests; ', ''),
};
