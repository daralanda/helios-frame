import { html, render, $, on, debounce } from '../../../../core/dom.js';
import { icon } from '../../../../components/base.js';
import { productCard } from '../../../../components/commerce.js';
import { pageHead } from '../../../_shared/ui.js';
import { toCard } from './_products.js';

export default {
  title: 'Katalog',
  render: () => html`${pageHead('Katalog', 'Fiyatlar bayi grubunuza özel ve KDV hariçtir. Üstü çizili fiyat liste fiyatıdır.',
      html`<a class="hf-btn" href="#/sepet">${icon('cart')}Sepete git</a>`)}
    <div class="hf-cluster hf-between">
      <div class="hf-cluster hf-gap-2" role="group" aria-label="Kategori" id="cats"></div>
      <div class="hf-input-group">${icon('search')}<input class="hf-input" type="search" id="q" placeholder="Ürün adı veya kod" aria-label="Katalogda ara"></div>
    </div>
    <p class="hf-muted hf-text-sm hf-mt-4" id="count" aria-live="polite"></p>
    <div class="hf-grid hf-grid--products hf-mt-2" id="grid"></div>`,
  async mount(el, app) {
    const all = (await app.data.get('examples/data/b2b/products.json', { cache: 60000 })).map(toCard);
    if (!$('#grid', el)) return undefined;
    const cats = ['Tümü', ...new Set(all.map((p) => p.cat))];
    let cat = 'Tümü'; let q = '';
    render($('#cats', el), html`${cats.map((c, i) => html`<button type="button" class="hf-btn hf-btn--sm ${i ? 'hf-btn--ghost' : 'hf-btn--soft'}" data-chip="${c}" aria-pressed="${!i}">${c}</button>`)}`);
    const paint = () => {
      const qq = q.toLocaleLowerCase('tr-TR');
      const list = all.filter((p) => (cat === 'Tümü' || p.cat === cat) && (!qq || `${p.name} ${p.brand}`.toLocaleLowerCase('tr-TR').includes(qq)));
      $('#count', el).textContent = `${list.length} ürün`;
      render($('#grid', el), list.length ? html`${list.map((p) => productCard(p))}` : html`<div class="hf-empty">${icon('search')}<p>Aramanıza uyan ürün yok.</p></div>`);
      app.hydrate($('#grid', el));
    };
    paint();
    const offs = [
      on(el, 'click', '[data-chip]', (e, b) => {
        cat = b.dataset.chip;
        for (const x of el.querySelectorAll('[data-chip]')) { const s = x === b; x.setAttribute('aria-pressed', String(s)); x.classList.toggle('hf-btn--soft', s); x.classList.toggle('hf-btn--ghost', !s); }
        paint();
      }),
      on(el, 'input', '#q', debounce((e) => { q = e.target.value; paint(); }, 150)),
    ];
    return () => offs.forEach((off) => off());
  },
};
