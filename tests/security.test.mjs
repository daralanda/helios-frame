// Güvenlik kuralları için statik denetim · node --test tests/
// Kodda kuralı bozan bir değişiklik yapılırsa bu testler başarısız olur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, SECURITY_HEADERS } from '../tools/headers.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['.git', 'node_modules', 'tests', 'tools']);

async function walk(dir, exts, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

test('innerHTML/outerHTML/insertAdjacentHTML/document.write yalnızca core/dom.js içinde', async () => {
  const offenders = [];
  for (const f of await walk(ROOT, ['.js'])) {
    const rel = relative(ROOT, f);
    if (rel === join('core', 'dom.js')) continue;
    const src = await readFile(f, 'utf8');
    if (/\.(innerHTML|outerHTML)\s*=|insertAdjacentHTML|document\.write/.test(src)) offenders.push(rel);
  }
  assert.deepEqual(offenders, []);
});

test('eval / new Function / string setTimeout yok', async () => {
  const offenders = [];
  for (const f of await walk(ROOT, ['.js'])) {
    const src = await readFile(f, 'utf8');
    if (/\beval\s*\(|new\s+Function\s*\(|setTimeout\(\s*['"`]/.test(src)) offenders.push(relative(ROOT, f));
  }
  assert.deepEqual(offenders, []);
});

test('HTML dosyalarında satır içi script, style ve olay özniteliği yok (CSP)', async () => {
  const offenders = [];
  for (const f of await walk(ROOT, ['.html'])) {
    const src = await readFile(f, 'utf8');
    const rel = relative(ROOT, f);
    // JSON-LD veri bloğu serbest; çalıştırılabilir satır içi script yasak
    for (const m of src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (!/type=["']application\/ld\+json["']/.test(m[1]) && m[2].trim()) offenders.push(`${rel}: satır içi script`);
    }
    if (/<style[\s>]/i.test(src)) offenders.push(`${rel}: <style>`);
    if (/\sstyle\s*=\s*["']/i.test(src)) offenders.push(`${rel}: style=""`);
    if (/\son[a-z]+\s*=\s*["']/i.test(src)) offenders.push(`${rel}: onX=""`);
    if (/href\s*=\s*["']\s*javascript:/i.test(src)) offenders.push(`${rel}: javascript: bağlantı`);
  }
  assert.deepEqual(offenders, []);
});

test('Dış kaynaktan script/stil/font yüklenmiyor', async () => {
  const offenders = [];
  for (const f of await walk(ROOT, ['.html'])) {
    const src = await readFile(f, 'utf8');
    if (/<(script|link)\b[^>]*(src|href)=["']https?:\/\//i.test(src.replace(/<link rel="canonical"[^>]*>/g, ''))) offenders.push(relative(ROOT, f));
  }
  assert.deepEqual(offenders, []);
});

test('.htaccess ve web.config güvenlik başlıkları tools/headers.mjs ile aynı', async () => {
  const ht = await readFile(join(ROOT, '.htaccess'), 'utf8');
  const wc = await readFile(join(ROOT, 'web.config'), 'utf8');
  assert.ok(ht.includes(`Content-Security-Policy "${CSP}"`), '.htaccess CSP farklı');
  assert.ok(wc.includes(`name="Content-Security-Policy" value="${CSP}"`), 'web.config CSP farklı');
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (k === 'Content-Security-Policy') continue;
    assert.ok(ht.includes(`Header always set ${k} "${v}"`), `.htaccess: ${k}`);
    assert.ok(wc.includes(`name="${k}" value="${v}"`), `web.config: ${k}`);
  }
});

test('Panel ve ödeme sayfaları arama motorlarına kapalı (noindex)', async () => {
  for (const p of ['examples/b2b/admin/index.html', 'examples/b2b/bayi/index.html', 'examples/crm/index.html', 'examples/hr/index.html', 'examples/shop/odeme.html', '404.html']) {
    const src = await readFile(join(ROOT, p), 'utf8');
    assert.match(src, /<meta name="robots" content="noindex/, p);
  }
});

test('Herkese açık sayfalarda title, description, canonical ve tek h1 var', async () => {
  const files = [join(ROOT, 'index.html'), join(ROOT, 'examples/index.html'), join(ROOT, 'examples/shop/index.html'),
    ...(await walk(join(ROOT, 'examples/shop/urun'), ['.html']))];
  for (const f of files) {
    const src = await readFile(f, 'utf8');
    const rel = relative(ROOT, f);
    assert.match(src, /<title>[^<]{10,}<\/title>/, `${rel}: title`);
    assert.match(src, /<meta name="description" content="[^"]{50,}"/, `${rel}: description`);
    assert.match(src, /<link rel="canonical" href="https:\/\//, `${rel}: canonical`);
    assert.equal((src.match(/<h1[\s>]/g) ?? []).length, 1, `${rel}: tek h1`);
    for (const img of src.matchAll(/<img\b[^>]*>/g)) {
      assert.match(img[0], /\salt=/, `${rel}: alt eksik`);
      assert.match(img[0], /\swidth=.*\sheight=/, `${rel}: width/height eksik (CLS)`);
    }
  }
});
