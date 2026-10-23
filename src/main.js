import { config } from './config.js';
import { loader } from './libs.js';
import { boot } from './app.js';
import { escapeHtml } from './core/dom.js';

const root = document.getElementById('app');

try {
  // UI çatısını (Bootstrap/Tailwind) uygulama açılmadan önce yükle -> stilsiz içerik flaşı olmaz.
  if (config.ui !== 'none') await loader.load(config.ui);
  root.innerHTML = '';
  await boot(root);
} catch (err) {
  console.error(err);
  root.innerHTML = `<div style="padding:2rem;font-family:system-ui">Uygulama başlatılamadı: ${escapeHtml(err.message)}</div>`;
}
