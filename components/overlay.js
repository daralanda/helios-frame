/**
 * Helios Frame · Bildirim (toast), diyalog ve popover yardımcıları.
 *
 *   import { toast, confirmDialog } from '/components/overlay.js';
 *   toast('Kaydedildi', { type: 'success' });
 *   if (await confirmDialog({ title: 'Silinsin mi?', message: '...', danger: true })) ...
 *
 * Bildirimsel kullanım (JS yazmadan):
 *   <button data-dialog-open="#yeni-teklif">Aç</button>
 *   <dialog id="yeni-teklif" class="hf-dialog"> ... <button data-dialog-close>Kapat</button></dialog>
 *   <button popovertarget="menu1">Menü</button><div id="menu1" class="hf-popover" popover>...</div>
 */
import { html, fragment, on } from '../core/dom.js';
import { app, icon } from './base.js';

/* ---------------- Toast ---------------- */
function region() {
  let r = document.querySelector('.hf-toasts');
  if (!r) {
    r = document.createElement('div');
    r.className = 'hf-toasts';
    r.setAttribute('role', 'region');
    r.setAttribute('aria-label', 'Bildirimler');
    document.body.append(r);
  }
  return r;
}

export function toast(message, { type = 'info', timeout = 4500 } = {}) {
  const t = app()?.t ?? ((k) => k);
  const node = fragment(html`<div class="hf-toast hf-toast--${type}" role="${type === 'danger' ? 'alert' : 'status'}">
    <span class="hf-toast__msg">${message}</span>
    <button type="button" class="hf-toast__close" aria-label="${t('dialog.close')}">${icon('x', 'hf-icon--sm')}</button>
  </div>`);
  const close = () => {
    if (node.dataset.leaving) return;
    node.dataset.leaving = '1';
    setTimeout(() => node.remove(), 200);
  };
  node.querySelector('button').addEventListener('click', close);
  let timer = timeout ? setTimeout(close, timeout) : null;
  // Fare üzerindeyken süreyi durdur (okumaya zaman tanı)
  node.addEventListener('pointerenter', () => clearTimeout(timer));
  node.addEventListener('pointerleave', () => { if (timeout) timer = setTimeout(close, 2000); });
  region().append(node);
  return close;
}

/* ---------------- Diyalog ---------------- */
export function confirmDialog({ title, message = '', okText, cancelText, danger = false } = {}) {
  const t = app().t;
  const dlg = fragment(html`<dialog class="hf-dialog" aria-labelledby="hf-confirm-title">
    <form method="dialog">
      <div class="hf-dialog__head"><h2 class="hf-dialog__title" id="hf-confirm-title">${title}</h2></div>
      <div class="hf-dialog__body"><p>${message}</p></div>
      <div class="hf-dialog__foot">
        <button class="hf-btn" value="cancel">${cancelText ?? t('dialog.cancel')}</button>
        <button class="hf-btn ${danger ? 'hf-btn--danger' : 'hf-btn--primary'}" value="ok" autofocus>${okText ?? t('dialog.ok')}</button>
      </div>
    </form>
  </dialog>`);
  document.body.append(dlg);
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'ok'); dlg.remove(); }, { once: true });
    dlg.showModal();
  });
}

/** Arka plana tıklayınca kapanma (native dialog'da yok). */
function lightDismiss(e) {
  const d = e.target;
  if (d instanceof HTMLDialogElement && d.open && d.dataset.static === undefined) {
    const r = d.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) d.close('cancel');
  }
}

/* ---------------- Popover konumlandırma ---------------- */
function placePopover(pop) {
  const invoker = document.querySelector(`[popovertarget="${CSS.escape(pop.id)}"]`);
  if (!invoker) return;
  const r = invoker.getBoundingClientRect();
  const w = pop.offsetWidth; const h = pop.offsetHeight;
  const vw = document.documentElement.clientWidth; const vh = innerHeight;
  let left = r.right - w;                     // sağa hizalı (üst çubuk için doğal)
  if (left < 8) left = Math.min(r.left, vw - w - 8);
  let top = r.bottom + 6;
  if (top + h > vh - 8 && r.top - h - 6 > 8) top = r.top - h - 6; // aşağı sığmıyorsa yukarı aç
  pop.style.left = `${Math.max(8, left)}px`;
  pop.style.top = `${top}px`;
}

let wired = false;
export function wireOverlays() {
  if (wired) return;
  wired = true;
  on(document, 'click', '[data-dialog-open]', (e, btn) => {
    const d = document.querySelector(btn.dataset.dialogOpen);
    if (d instanceof HTMLDialogElement) { e.preventDefault(); d.showModal(); }
  });
  on(document, 'click', '[data-dialog-close]', (e, btn) => btn.closest('dialog')?.close('cancel'));
  document.addEventListener('click', lightDismiss);
  document.addEventListener('toggle', (e) => {
    if (e.newState === 'open' && e.target.classList?.contains('hf-popover')) placePopover(e.target);
  }, true);
  // Popover içindeki bir bağlantıya/düğmeye basınca menüyü kapat
  on(document, 'click', '.hf-popover a, .hf-popover [data-close]', (e, el) => el.closest('[popover]')?.hidePopover?.());
  app().bus.on('toast', (p) => toast(p.message, p));
}
