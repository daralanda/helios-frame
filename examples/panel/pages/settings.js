import { html, $, on } from '../../../core/dom.js';
import { setMode, getMode, setWidth, getWidth } from '../../../core/theme.js';
import { pageHead } from './_ui.js';

export default {
  title: 'Ayarlar',
  render: (app) => html`${pageHead('Ayarlar', 'Kullanıcıya özel görünüm tercihleri (tarayıcıda saklanır).')}
    <div class="hf-grid hf-grid--2">
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Görünüm</h2></div>
        <div class="hf-card__body hf-stack">
          <div class="hf-field"><label class="hf-label" for="s-width">İçerik genişliği</label>
            <select class="hf-select" id="s-width"><option value="">Varsayılan (${app.config.layout.width})</option>
              <option value="full">Tam genişlik</option><option value="wide">Geniş</option><option value="normal">Normal</option><option value="narrow">Dar</option></select></div>
          <div class="hf-field"><label class="hf-label" for="s-mode">Tema</label>
            <select class="hf-select" id="s-mode"><option value="auto">Sistem</option><option value="light">Açık</option><option value="dark">Koyu</option></select></div>
          <label class="hf-check"><input class="hf-switch" type="checkbox" role="switch" id="s-compact"> Sık yerleşim (tablolarda daha çok satır)</label>
          <label class="hf-check"><input class="hf-switch" type="checkbox" role="switch" id="s-collapsed"> Kenar menüyü daralt</label>
        </div></section>
      <section class="hf-card"><div class="hf-card__head"><h2 class="hf-card__title">Hesap</h2></div>
        <div class="hf-card__body hf-stack hf-gap-2">
          <div><span class="hf-muted">Ad soyad:</span> <strong>${app.user?.name ?? '-'}</strong></div>
          <div><span class="hf-muted">E-posta:</span> <strong>${app.user?.email ?? '-'}</strong></div>
          <div class="hf-cluster hf-gap-2"><span class="hf-muted">Roller:</span>${(app.user?.roles ?? []).map((r) => html`<span class="hf-badge hf-badge--primary">${r}</span>`)}</div>
          <p class="hf-hint hf-mt-4">Oturum bilgisi HttpOnly çerezde tutulmalı, tarayıcı depolamasına yazılmamalıdır.</p>
        </div></section>
    </div>`,
  mount(el, app) {
    const root = document.documentElement;
    const shell = document.querySelector('hd-shell');
    $('#s-mode', el).value = getMode();
    $('#s-width', el).value = getWidth() ?? '';
    $('#s-compact', el).checked = root.dataset.density === 'compact';
    $('#s-collapsed', el).checked = !!document.querySelector('.hf-app[data-collapsed]');
    const offs = [
      on(el, 'change', '#s-mode', (e) => setMode(e.target.value)),
      on(el, 'change', '#s-width', (e) => setWidth(e.target.value || null, { fallback: app.config.layout.width })),
      on(el, 'change', '#s-compact', (e) => { if (e.target.checked) root.dataset.density = 'compact'; else delete root.dataset.density; }),
      on(el, 'change', '#s-collapsed', (e) => shell?.setCollapsed(e.target.checked)),
    ];
    return () => offs.forEach((off) => off());
  },
};
