import { html, render, $, on } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { enhanceForm } from '../../../../core/validate.js';
import { pageHead } from '../../../_shared/ui.js';

const RATES = { 1: 0, 3: 0.039, 6: 0.072, 9: 0.105 };

export default {
  title: 'Ödeme yap',
  render: () => html`${pageHead('Ödeme yap', 'Kart bilgileri bu sayfada alınmaz; ödeme bankanın 3D Secure sayfasında tamamlanır.')}
    <form class="hf-split" id="pay" novalidate>
      <section class="hf-card"><div class="hf-card__body hf-form-grid">
        <div class="hf-field"><label class="hf-label" for="amount">Tutar (₺)<span class="hf-req">*</span></label>
          <input class="hf-input" id="amount" name="amount" type="number" min="100" max="500000" step="0.01" required inputmode="decimal"></div>
        <div class="hf-field"><label class="hf-label" for="bank">Kart bankası</label>
          <select class="hf-select" id="bank" name="bank"><option>Garanti BBVA</option><option>İş Bankası</option><option>Akbank</option><option>Yapı Kredi</option></select></div>
        <fieldset class="hf-span-full hf-stack hf-gap-2"><legend class="hf-label">Taksit</legend><div id="inst" class="hf-grid hf-grid--kpi"></div></fieldset>
        <div class="hf-field hf-span-full"><label class="hf-label" for="note">Açıklama</label><input class="hf-input" id="note" name="note" maxlength="140" placeholder="Ör. Kasım ayı ödemesi"></div>
      </div></section>
      <aside class="hf-card hf-card--elevated"><div class="hf-card__body hf-stack">
        <h2 class="hf-card__title">Özet</h2><div id="sum" class="hf-stack hf-gap-2"></div>
        <button class="hf-btn hf-btn--primary hf-btn--lg hf-btn--block" type="submit">${icon('shield', 'hf-icon--sm')}Bankaya yönlen</button>
        <p class="hf-hint">PCI-DSS: Kart numarası Helios sunucularına ulaşmaz.</p>
      </div></aside>
    </form>`,
  mount(el, app) {
    const form = $('#pay', el);
    const paint = () => {
      const amount = Number(form.amount.value) || 0;
      const sel = Number(new FormData(form).get('inst') || 1);
      render($('#inst', el), html`${Object.entries(RATES).map(([n, r]) => html`<label class="hf-option">
        <input type="radio" name="inst" value="${n}" ${Number(n) === sel ? html`checked` : ''}>
        <span><strong>${n === '1' ? 'Tek çekim' : `${n} taksit`}</strong><br><span class="hf-muted hf-text-xs">${amount ? `${n} × ${app.fmt.money((amount * (1 + r)) / Number(n))}` : r ? `vade farkı ${app.fmt.percent(r)}` : 'vade farksız'}</span></span></label>`)}`);
      const fee = amount * RATES[sel];
      render($('#sum', el), html`<div class="hf-cluster hf-between"><span class="hf-muted">Ödeme</span><span class="hf-num">${app.fmt.money(amount)}</span></div>
        <div class="hf-cluster hf-between"><span class="hf-muted">Vade farkı</span><span class="hf-num">${app.fmt.money(fee)}</span></div><hr>
        <div class="hf-cluster hf-between"><span class="hf-bold">Karttan çekilecek</span><span class="hf-num hf-bold hf-text-lg">${app.fmt.money(amount + fee)}</span></div>`);
    };
    paint();
    const offs = [
      on(form, 'input', '#amount', paint),
      on(form, 'change', 'input[name="inst"]', paint),
      enhanceForm(form, {
        t: app.t,
        onSubmit: async () => {
          await new Promise((r) => setTimeout(r, 600));
          app.bus.emit('toast', { message: 'Demo: Gerçek projede bankanın 3D Secure sayfasına yönlendirilirsiniz.', type: 'info', timeout: 6000 });
        },
      }),
    ];
    return () => offs.forEach((off) => off());
  },
};
