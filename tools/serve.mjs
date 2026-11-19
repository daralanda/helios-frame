#!/usr/bin/env node
/**
 * Helios Frame · Yerel geliştirme sunucusu (bağımlılıksız, YALNIZCA geliştirme içindir).
 * Canlıdaki .htaccess ile aynı güvenlik başlıklarını (CSP dahil) gönderir; böylece
 * CSP/Trusted Types ihlalleri daha geliştirme aşamasında görünür.
 *
 *   node tools/serve.mjs            -> http://localhost:8080
 *   PORT=3000 node tools/serve.mjs
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEV_HEADERS as SECURITY_HEADERS } from './headers.mjs';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon',
};
const DENY = /(^|\/)(\.git|\.github|node_modules|tests|tools|package(-lock)?\.json)(\/|$)|\/\.[^/]+$/;

createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (DENY.test(path)) { res.writeHead(404).end('Not found'); return; }
    let file = normalize(join(ROOT, path));
    if (file !== ROOT && !file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; } // dizin dışına çıkma
    if ((await stat(file).catch(() => null))?.isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...SECURITY_HEADERS });
    res.end(body);
  } catch {
    const body = await readFile(join(ROOT, '404.html')).catch(() => 'Sayfa bulunamadı');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS }).end(body);
  }
}).listen(PORT, () => console.log(`Helios Frame: http://localhost:${PORT}`));
