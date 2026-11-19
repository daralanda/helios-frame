/** Ana sayfa (vitrin) demo davranışları: tema stüdyosu, KPI kartları, grafik, bildirimler. */
import { ready } from '../core/app.js';
import { html, render, $, on } from '../core/dom.js';
import { applyTheme, setMode } from '../core/theme.js';
import { toast, confirmDialog } from '../components/overlay.js';
import { kpiCard } from './kpi.js';

const app = await ready;

/* ---------- KPI + grafikler ---------- */
const stats = await app.data.get('data/stats.json', { cache: 60000 });
render($('#kpis'), html`${stats.kpis.map((k) => kpiCard(k, app))}`);
$('#sales-chart').data = stats.sales;
$('#cat-chart').data = stats.categories;

/* ---------- Bildirim / diyalog ---------- */
on(document, 'click', '[data-demo-toast]', (e, b) => {
  const ok = b.dataset.demoToast === 'success';
  toast(ok ? 'Değişiklikler kaydedildi.' : 'Sunucuya ulaşılamadı, tekrar deneyin.', { type: b.dataset.demoToast });
});
$('#demo-confirm').addEventListener('click', async () => {
  const yes = await confirmDialog({ title: 'Teklif silinsin mi?', message: 'TK-2026-118 numaralı teklif kalıcı olarak silinecek.', okText: 'Sil', danger: true });
  toast(yes ? 'Teklif silindi.' : 'İşlem iptal edildi.', { type: yes ? 'success' : 'info' });
});
$('#demo-form').addEventListener('submit', (e) => {
  if (!e.defaultPrevented) { e.preventDefault(); toast('Form geçerli. Gerçek projede veri sunucuya gönderilir.', { type: 'success' }); }
});

/* ---------- Tema stüdyosu ---------- */
const form = $('#theme-form');
const out = $('#theme-json');
const base = app.config.theme;

function currentTheme() {
  const f = new FormData(form);
  const radius = `${f.get('radius')}px`;
  return {
    mode: f.get('mode'),
    density: f.get('compact') ? 'compact' : 'comfortable',
    colors: { brand: f.get('brand'), accent: f.get('accent') },
    radius,
    components: {
      card: { radius: `${Math.round(Number(f.get('radius')) * 1.4)}px`, ...(f.get('flat') ? { shadow: 'none' } : {}) },
      button: { radius },
    },
  };
}

function apply() {
  const theme = currentTheme();
  $('#t-radius-out').textContent = theme.radius;
  applyTheme(theme);
  setMode(theme.mode);
  out.textContent = JSON.stringify({ theme }, null, 2);
}

// Formu mevcut ayarlarla doldur
form.brand.value = base.colors.brand ?? '#f47b20';
form.accent.value = base.colors.accent ?? '#383e42';
form.radius.value = parseInt(base.radius ?? '10', 10);
form.mode.value = localStorage.getItem('hf-theme-mode') || base.mode || 'auto';
on(form, 'input', 'input, select', apply);
on(form, 'change', 'input, select', apply);
out.textContent = JSON.stringify({ theme: currentTheme() }, null, 2);

$('#theme-reset').addEventListener('click', () => {
  try { localStorage.removeItem('hf-theme-mode'); } catch { /* yok say */ }
  form.reset();
  form.brand.value = base.colors.brand; form.accent.value = base.colors.accent;
  form.radius.value = parseInt(base.radius ?? '10', 10); form.mode.value = base.mode;
  applyTheme(base);
  setMode(base.mode, { persist: false });
  out.textContent = JSON.stringify({ theme: currentTheme() }, null, 2);
});
