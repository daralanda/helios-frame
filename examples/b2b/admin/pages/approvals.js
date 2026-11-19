import { html, render, $, on } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { confirmDialog } from '../../../../components/overlay.js';
import { pageHead } from '../../../_shared/ui.js';

export default {
  title: 'Onay bekleyenler',
  render: () => html`${pageHead('Onay bekleyenler', 'Limit aşımı, iskonto, vade ve iade talepleri. Onay kuralları ve yetki devri Yönetim menüsündedir.')}
    <div class="hf-grid hf-grid--2" id="list"></div>`,
  async mount(el, app) {
    let items = await app.data.get('examples/data/b2b/approvals.json', { cache: 60000 });
    const box = $('#list', el);
    if (!box) return undefined;
    const paint = () => render(box, items.length ? html`${items.map((a) => html`<article class="hf-card">
      <div class="hf-card__head"><div><h2 class="hf-card__title">${a.kind}</h2><p class="hf-card__subtitle">${a.id} · ${app.fmt.relative(a.date)}</p></div>
        <span class="hf-badge hf-badge--warning">${a.step}</span></div>
      <div class="hf-card__body hf-stack hf-gap-2">
        <div class="hf-cluster hf-between"><span class="hf-muted">Bayi</span><strong>${a.dealer}</strong></div>
        <div class="hf-cluster hf-between"><span class="hf-muted">Tutar</span><strong class="hf-num">${app.fmt.money(a.amount)}</strong></div>
        <div class="hf-cluster hf-between"><span class="hf-muted">Talep eden</span><span>${a.requester}</span></div>
      </div>
      <div class="hf-card__foot">
        <button class="hf-btn hf-btn--ghost" type="button" data-reject="${a.id}">${icon('x', 'hf-icon--sm')}Reddet</button>
        <button class="hf-btn hf-btn--primary" type="button" data-approve="${a.id}">${icon('check', 'hf-icon--sm')}Onayla</button>
      </div></article>`)}`
      : html`<div class="hf-card"><div class="hf-empty">${icon('check')}<p>Onay bekleyen talep kalmadı.</p></div></div>`);
    paint();
    const done = (id, msg, type) => { items = items.filter((x) => x.id !== id); paint(); app.bus.emit('toast', { message: msg, type }); };
    const offs = [
      on(box, 'click', '[data-approve]', (e, b) => done(b.dataset.approve, `${b.dataset.approve} onaylandı; sonraki adıma iletildi.`, 'success')),
      on(box, 'click', '[data-reject]', async (e, b) => {
        if (await confirmDialog({ title: 'Talep reddedilsin mi?', message: `${b.dataset.reject} numaralı talep reddedilecek ve talep edene bildirilecek.`, okText: 'Reddet', danger: true })) {
          done(b.dataset.reject, `${b.dataset.reject} reddedildi.`, 'info');
        }
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
